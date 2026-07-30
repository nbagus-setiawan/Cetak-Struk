const STORE = {
  name: "TOKO ARSY-ARYS",
  addr: "Jl. Putak Kec. Gelumbang Kab. Muara Enim <br> +62 851 8890 6264"
};

/* ======================= FIELD DINAMIS PER JENIS ======================= */
const BANKS = ["BCA","BRI","BNI","Mandiri","BSI","CIMB Niaga","Permata","BTN","Danamon"];
const EWALLETS = ["DANA","OVO","GoPay","ShopeePay","LinkAja","Isaku"];

const FIELD_CONFIG = {
  transfer_bank: {
    label: "Transfer Bank",
    fields: [
      {id:"bankAsal", label:"Bank Pengirim", type:"select", options:BANKS},
      {id:"bankTujuan", label:"Bank Tujuan", type:"select", options:BANKS},
      {id:"noRek", label:"No. Rekening Tujuan", type:"text", placeholder:"cth: 1234567890"},
      {id:"namaPenerima", label:"Nama Penerima", type:"text", placeholder:"cth: SITI AMINAH"},
    ]
  },
  tarik_tunai_bank: {
    label: "Tarik Tunai Bank",
    fields: [
      {id:"bankAsal", label:"Bank / Kartu", type:"select", options:BANKS},
      {id:"noRek", label:"No. Rekening / Kartu", type:"text", placeholder:"cth: 1234567890"},
    ]
  },
  topup_ewallet: {
    label: "Top Up E-Wallet",
    fields: [
      {id:"ewallet", label:"Jenis E-Wallet", type:"select", options:EWALLETS},
      {id:"noHp", label:"No. HP Tujuan", type:"text", placeholder:"cth: 0812xxxxxxx"},
    ]
  },
  tarik_tunai_ewallet: {
    label: "Tarik Tunai E-Wallet",
    fields: [
      {id:"ewallet", label:"Jenis E-Wallet", type:"select", options:EWALLETS},
      {id:"noHp", label:"No. HP", type:"text", placeholder:"cth: 0812xxxxxxx"},
    ]
  }
};

const dynamicFieldsEl = document.getElementById('dynamicFields');
const jenisSelect = document.getElementById('jenisTransaksi');

function renderDynamicFields(){
  const cfg = FIELD_CONFIG[jenisSelect.value];
  dynamicFieldsEl.innerHTML = cfg.fields.map(f=>{
    if(f.type==="select"){
      return `<div class="field"><label>${f.label}</label>
        <select id="${f.id}">${f.options.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
    }
    return `<div class="field"><label>${f.label}</label>
      <input type="text" id="${f.id}" placeholder="${f.placeholder||''}"></div>`;
  }).join('');
}
jenisSelect.addEventListener('change', renderDynamicFields);
renderDynamicFields();

/* ======================= HELPER ======================= */
function rupiah(n){
  n = Number(n)||0;
  return "Rp " + n.toLocaleString('id-ID');
}
function nowStr(){
  const d = new Date();
  const tgl = d.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
  const jam = d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  return {tgl, jam};
}
function genTrxId(){
  const d = new Date();
  const ym = d.getFullYear()+String(d.getMonth()+1).padStart(2,'0');
  return `INV/${ym}/${Date.now().toString().slice(-6)}`;
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ======================= SUSUN NOTA ======================= */
const receiptEl = document.getElementById('receipt');
const previewCard = document.getElementById('previewCard');
let lastTrx = null;

document.getElementById('btnGenerate').addEventListener('click', ()=>{
  const jenis = jenisSelect.value;
  const cfg = FIELD_CONFIG[jenis];
  const nominal = Number(document.getElementById('nominal').value)||0;
  const admin = Number(document.getElementById('admin').value)||0;
  const metode = document.getElementById('metodeBayar').value;
  const namaPelanggan = document.getElementById('namaPelanggan').value.trim();
  const catatan = document.getElementById('catatan').value.trim();

  if(nominal<=0){
    alert('Isi nominal transaksi terlebih dahulu.');
    return;
  }

  const detailFields = cfg.fields.map(f=>{
    const el = document.getElementById(f.id);
    return {label:f.label, value: el ? el.value : ''};
  });

  const isTarikan = (jenis==='tarik_tunai_bank' || jenis==='tarik_tunai_ewallet');
  const total = isTarikan ? (nominal - admin) : (nominal + admin);
  const totalLabel = isTarikan ? "Diterima Pelanggan" : "Dibayar Pelanggan";

  const {tgl, jam} = nowStr();
  const trxId = genTrxId();

  lastTrx = {
    trxId, tgl, jam, jenis, jenisLabel: cfg.label, detailFields,
    nominal, admin, total, totalLabel, metode, namaPelanggan, catatan
  };

  renderReceipt(lastTrx);
  previewCard.style.display = 'block';
  previewCard.scrollIntoView({behavior:'smooth', block:'start'});
  hideStatus();
});

function receiptRow(label, value){
  return `<tr><td class="k">${label}</td><td class="v">${value}</td></tr>`;
}

function renderReceipt(t){
  const detailHtml = t.detailFields.filter(f=>f.value)
    .map(f=> receiptRow(f.label, escapeHtml(f.value))).join('');

  const storeInitial = STORE.name.trim().charAt(0).toUpperCase();

  receiptEl.innerHTML = `
    <div class="r-topbar"></div>
    <div class="r-stamp" id="rStamp">
      <span class="big">LUNAS</span>
      <span class="small">${t.tgl}</span>
    </div>
    <div class="r-body">
      <div class="r-store">
        <div class="r-logo">${storeInitial}</div>
        <div class="name">${STORE.name}</div>
        <div class="addr">${STORE.addr}</div>
      </div>

      <div class="r-status">
        <div class="label"><span class="ok">✓</span>Transaksi Berhasil</div>
        <div class="time">${t.tgl} · ${t.jam} WIB</div>
      </div>

      <div class="r-amount">
        <div class="lbl">${t.totalLabel}</div>
        <div class="val">${rupiah(t.total)}</div>
      </div>

      <hr class="r-hr">

      <div class="r-sectitle">Detail Transaksi</div>
      <table class="r-table">
        ${receiptRow('Jenis Transaksi', t.jenisLabel)}
        ${detailHtml}
        ${t.namaPelanggan? receiptRow('Pelanggan', escapeHtml(t.namaPelanggan)) : ''}
        ${receiptRow('Nominal', rupiah(t.nominal))}
        ${receiptRow('Biaya Admin', rupiah(t.admin))}
        ${receiptRow('Metode Bayar', t.metode)}
        ${t.catatan? receiptRow('Catatan', escapeHtml(t.catatan)) : ''}
        <tr class="total"><td class="k">${t.totalLabel}</td><td class="v">${rupiah(t.total)}</td></tr>
      </table>

      <div class="r-ref">
        <span class="k">No. Referensi</span>
        <span class="v">${t.trxId}</span>
      </div>

      <div class="r-barcode"></div>
      <div class="r-code">${t.trxId}</div>

      <div class="r-foot">
        Nota ini sah sebagai bukti transaksi tanpa tanda tangan basah.
        <div class="sys">Dicetak otomatis oleh sistem kasir digital</div>
      </div>
    </div>
  `;

  requestAnimationFrame(()=>{
    const st = document.getElementById('rStamp');
    if(st) st.classList.add('drop');
  });
}

/* ======================= STATUS BOX ======================= */
const statusBox = document.getElementById('statusBox');
function showStatus(msg, type){
  statusBox.textContent = msg;
  statusBox.className = 'status-box show ' + (type||'');
}
function hideStatus(){ statusBox.className = 'status-box'; }

/* ======================= CETAK VIA BLUETOOTH (ESC/POS) ======================= */
/*
  CATATAN PENTING:
  - Web Bluetooth API HANYA berjalan di Chrome/Edge Android, via koneksi HTTPS.
    TIDAK didukung di Safari/iOS (keterbatasan browser, bukan kode ini).
  - UUID di bawah adalah UUID umum untuk printer thermal ESC/POS murah (BLE).
    Jika printer tidak terdeteksi/tidak mau print, sesuaikan SERVICE_UUID &
    CHAR_UUID dengan datasheet printer yang dipakai.
*/
const SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const CHAR_UUID    = '00002af1-0000-1000-8000-00805f9b34fb';

function buildEscPosBytes(t){
  const enc = new TextEncoder();
  const ESC = 0x1B, GS = 0x1D;
  let out = [];
  const push = (...b)=> out.push(...b);
  const text = (s)=> push(...enc.encode(s));
  const line = ()=> text("--------------------------------\n");

  push(ESC,0x40);
  push(ESC,0x61,0x01);
  push(ESC,0x21,0x30); text(STORE.name+"\n");
  push(ESC,0x21,0x00);
  text(STORE.addr+"\n");
  line();
  push(ESC,0x61,0x00);
  text(`No: ${t.trxId}\n`);
  text(`Tgl: ${t.tgl}  Jam: ${t.jam}\n`);
  push(ESC,0x61,0x01);
  push(ESC,0x21,0x08); text(t.jenisLabel.toUpperCase()+"\n"); push(ESC,0x21,0x00);
  push(ESC,0x61,0x00);
  t.detailFields.filter(f=>f.value).forEach(f=> text(`${f.label}: ${f.value}\n`));
  if(t.namaPelanggan) text(`Pelanggan: ${t.namaPelanggan}\n`);
  line();
  text(`Nominal   : ${rupiah(t.nominal)}\n`);
  text(`Adm       : ${rupiah(t.admin)}\n`);
  line();
  push(ESC,0x21,0x08);
  text(`${t.totalLabel}: ${rupiah(t.total)}\n`);
  push(ESC,0x21,0x00);
  text(`Metode: ${t.metode}\n`);
  if(t.catatan) text(`Catatan: ${t.catatan}\n`);
  push(ESC,0x61,0x01);
  text("\nTerima kasih\n");
  text("Nota sah tanpa tanda tangan\n\n\n");
  push(GS,0x56,0x42,0x00);
  return new Uint8Array(out);
}

document.getElementById('btnConnectPrint').addEventListener('click', async ()=>{
  if(!lastTrx){ alert('Susun nota terlebih dahulu.'); return; }

  if(!navigator.bluetooth){
    showStatus('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge di Android melalui HTTPS, atau pakai "Cetak via Print Browser" sementara.', 'err');
    return;
  }

  try{
    showStatus('Mencari printer Bluetooth di sekitar...', '');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    showStatus(`Menghubungkan ke "${device.name||'printer'}"...`, '');
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CHAR_UUID);

    const bytes = buildEscPosBytes(lastTrx);
    const CHUNK = 180;
    for(let i=0;i<bytes.length;i+=CHUNK){
      await characteristic.writeValue(bytes.slice(i,i+CHUNK));
    }
    showStatus('Nota berhasil dikirim ke printer.', 'ok');
  }catch(err){
    console.error(err);
    showStatus('Gagal cetak: '+(err.message||err)+'. Pastikan printer menyala & Bluetooth aktif, atau sesuaikan UUID service/characteristic untuk model printer kamu.', 'err');
  }
});

document.getElementById('btnBrowserPrint').addEventListener('click', ()=>{
  window.print();
});

/* ======================= RIWAYAT (localStorage) ======================= */
const HIST_KEY = 'struk_riwayat_v2';
function getHist(){
  try{ return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }catch(e){ return []; }
}
function saveHist(list){
  localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0,30)));
}
function renderHist(){
  const list = getHist();
  const el = document.getElementById('histList');
  if(list.length===0){
    el.innerHTML = '<div class="empty">Belum ada transaksi tersimpan.</div>';
    return;
  }
  el.innerHTML = list.map((t,i)=>`
    <div class="hist-item">
      <div>
        <div class="t">${t.jenisLabel}</div>
        <div class="d">${t.tgl} · ${t.jam} · ${t.trxId}</div>
      </div>
      <div style="text-align:right;">
        <div class="amt">${rupiah(t.total)}</div>
        <button onclick="reprint(${i})">cetak ulang</button>
      </div>
    </div>
  `).join('');
}
window.reprint = function(i){
  const list = getHist();
  lastTrx = list[i];
  renderReceipt(lastTrx);
  previewCard.style.display = 'block';
  previewCard.scrollIntoView({behavior:'smooth', block:'start'});
};

document.getElementById('btnSaveHist').addEventListener('click', ()=>{
  if(!lastTrx) return;
  const list = getHist();
  list.unshift(lastTrx);
  saveHist(list);
  renderHist();
  showStatus('Transaksi disimpan ke riwayat perangkat ini.', 'ok');
});

renderHist();
