const STORE = {
  name: "ARSYA ARSY DIGITAL",
  addr1: "Jl. Putak, Kec. Gelumbang",
  addr2: "Kab. Muara Enim",
  phone: "0851 8890 6264"
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
      {id:"ewallet", label:"E-Wallet", type:"select", options:EWALLETS},
      {id:"noHp", label:"Nomor Tujuan", type:"text", placeholder:"cth: 0812xxxxxxx"},
    ]
  },
  tarik_tunai_ewallet: {
    label: "Tarik Tunai E-Wallet",
    fields: [
      {id:"ewallet", label:"E-Wallet", type:"select", options:EWALLETS},
      {id:"noHp", label:"Nomor Tujuan", type:"text", placeholder:"cth: 0812xxxxxxx"},
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
  return "Rp" + n.toLocaleString('id-ID');
}
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function nowStr(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const tgl = `${dd}/${mm}/${yyyy}`;
  const tglLong = `${dd} ${MONTH_NAMES[d.getMonth()]} ${yyyy}`;
  const jam = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return {tgl, tglLong, jam};
}
function formatPhone(raw){
  const digits = String(raw||'').replace(/\D/g,'');
  if(!digits) return raw||'';
  return digits.match(/.{1,4}/g).join('-');
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
    let value = el ? el.value : '';
    if(f.id === 'noHp') value = formatPhone(value);
    return {label:f.label, value};
  });

  const isTarikan = (jenis==='tarik_tunai_bank' || jenis==='tarik_tunai_ewallet');

  // Jika penarikan tunai, total sama dengan nominal (tanpa dikurangi admin)
  const total = isTarikan ? nominal : (nominal + admin);
  const totalLabel = isTarikan ? "Total Diterima" : "Total Dibayar";

  const {tgl, tglLong, jam} = nowStr();
  const trxId = genTrxId();

  lastTrx = {
    trxId, tgl, tglLong, jam, jenis, jenisLabel: cfg.label, detailFields,
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

  receiptEl.innerHTML = `
    <div class="r-body">
      <div class="r-store">
        <!-- Logo Fastpay -->
        <img src="logo-fastpay.png" alt="Fastpay Logo" class="r-logo">
        <div class="name">${STORE.name}</div>
        <div class="addr">${STORE.addr1}<br>${STORE.addr2}</div>
        <div class="wa">WhatsApp: ${formatPhone(STORE.phone)}</div>
      </div>

      <div class="r-status">
        <div class="label"><span class="ok">✓</span>Transaksi Berhasil</div>
        <div class="time">${t.tgl} • ${t.jam} WIB</div>
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
        ${receiptRow('Metode Pembayaran', t.metode)}
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
        <div class="foot-title">Bukti Transaksi Resmi</div>
        Struk ini merupakan bukti transaksi resmi.<br>
        Sah tanpa tanda tangan dan cap basah.
        <div class="foot-note">Simpan struk ini sebagai bukti transaksi.</div>
        <div class="foot-thanks">Terima kasih telah bertransaksi.</div>
      </div>
    </div>
  `;
}

/* ======================= STATUS BOX ======================= */
const statusBox = document.getElementById('statusBox');
function showStatus(msg, type){
  statusBox.textContent = msg;
  statusBox.className = 'status-box show ' + (type||'');
}
function hideStatus(){ statusBox.className = 'status-box'; }

/* ======================= CETAK VIA BLUETOOTH (ESC/POS NATIVE) ======================= */
// Sama seperti struk Fastpay asli: teks dicetak native oleh printer (tajam & cepat),
// hanya LOGO dan BARCODE yang dikirim sebagai gambar/perintah khusus.
const SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const CHAR_UUID    = '00002af1-0000-1000-8000-00805f9b34fb';

// Lebar kertas dalam kolom karakter (font normal). 58mm biasanya 32 kolom, 80mm 48 kolom.
const PRINTER_COLS = 32;
// Lebar kertas dalam dot (58mm ≈ 384 dot, cocok dengan 32 kolom teks di atas).
// Ganti ke 576 kalau kertas printer kamu 80mm (dan PRINTER_COLS ke 48).
const PAPER_WIDTH_DOTS = 384;
// Lebar logo itu sendiri saat dicetak (harus <= PAPER_WIDTH_DOTS).
const LOGO_WIDTH_DOTS = 260;

/* ---- Utilitas gambar (khusus logo) ---- */
async function loadLogoBitmap(logoWidthDots, paperWidthDots){
  const img = new Image();
  img.src = 'logo-fastpay.png';
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  const scale = logoWidthDots / img.naturalWidth;
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const offsetX = Math.max(0, Math.round((paperWidthDots - logoWidthDots) / 2));

  const canvas = document.createElement('canvas');
  canvas.width = paperWidthDots; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, paperWidthDots, h);
  ctx.drawImage(img, offsetX, 0, logoWidthDots, h);

  const data = ctx.getImageData(0, 0, paperWidthDots, h).data;
  const bytesPerRow = Math.ceil(paperWidthDots / 8);
  const bitmap = new Uint8Array(bytesPerRow * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < paperWidthDots; x++) {
      const idx = (y * paperWidthDots + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      const lum = a < 10 ? 255 : (0.299*r + 0.587*g + 0.114*b);
      if (lum < 160) {
        const bi = y * bytesPerRow + (x >> 3);
        bitmap[bi] |= (0x80 >> (x & 7));
      }
    }
  }
  return { bitmap, width: paperWidthDots, height: h, bytesPerRow };
}

function buildEscPosRasterCommand({ bitmap, height, bytesPerRow }){
  const GS = 0x1D;
  const xL = bytesPerRow & 0xFF, xH = (bytesPerRow >> 8) & 0xFF;
  const yL = height & 0xFF,      yH = (height >> 8) & 0xFF;
  const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  const out = new Uint8Array(header.length + bitmap.length);
  out.set(header, 0);
  out.set(bitmap, header.length);
  return out;
}

/* ---- Barcode native (dicetak langsung oleh printer, bukan gambar) ---- */
function buildCode128Barcode(data, { height = 60, moduleWidth = 2 } = {}){
  const GS = 0x1D;
  const enc = new TextEncoder();

  let digits = String(data).replace(/\D/g, '');
  if (digits.length === 0) digits = '0';
  if (digits.length % 2 !== 0) digits = '0' + digits; // Code Set C butuh jumlah digit genap

  const payloadBytes = enc.encode('{C' + digits); // Code Set C (numerik, paling ringkas)
  const out = [];
  out.push(GS, 0x68, height);        // GS h  - tinggi barcode
  out.push(GS, 0x77, moduleWidth);   // GS w  - lebar modul
  out.push(GS, 0x48, 0);             // GS H  - matikan teks HRI otomatis (kita cetak manual)
  out.push(GS, 0x6B, 73, payloadBytes.length, ...payloadBytes); // GS k m n data (CODE128)
  return new Uint8Array(out);
}

/* ---- Susun bagian teks struk (native font printer) ----
 * RAPI 58mm:
 * - twoCol mensyaratkan minimal 2 spasi jarak antara label & nilai; kalau
 *   nggak cukup, otomatis pindah baris & nilainya rata kanan.
 * - Baris TOTAL dibatasi garis ganda ("=") biar beda & lebih menonjol
 *   dibanding pembatas biasa ("-").
 * - Jenis transaksi (mis. "TRANSFER BANK") dan garis di sekelilingnya
 *   dicetak bold, biar langsung kelihatan tanpa harus baca detail.
 * - Semua jarak antar bagian pakai FEED SETENGAH BARIS (ESC J, feed per
 *   dot) bukan baris kosong penuh — jadi struk lebih ringkas/rapat &
 *   hemat kertas, terutama antara detail tujuan & nominal. */
function buildReceiptTextBytes(t){
  const ESC = 0x1B, GS = 0x1D;
  const enc = new TextEncoder();
  const out = [];
  const push = (...b) => out.push(...b);
  const text = (s) => push(...enc.encode(s));
  const divider = () => text('-'.repeat(PRINTER_COLS) + '\n');
  const doubleDivider = () => text('='.repeat(PRINTER_COLS) + '\n');

  // Feed setengah baris: ESC J n = feed kertas n dot tanpa mencetak baris
  // kosong penuh. Line height normal printer thermal ~24-32 dot, jadi 12
  // dot kira-kira setengahnya. Naikkan/turunkan angka ini kalau printer
  // kamu terasa masih kejauhan/kerapatan.
  const HALF_GAP_DOTS = 12;
  const halfGap = () => push(ESC, 0x4A, HALF_GAP_DOTS);

  const twoCol = (l, r) => {
    l = String(l); r = String(r);
    // minimal 2 spasi jarak; kalau nggak muat, pindah baris & rata kanan
    if (l.length + r.length + 2 > PRINTER_COLS) {
      return l + '\n' + r.padStart(PRINTER_COLS) + '\n';
    }
    return l + ' '.repeat(PRINTER_COLS - l.length - r.length) + r + '\n';
  };

  const alignCenter = () => push(ESC, 0x61, 0x01);
  const alignLeft   = () => push(ESC, 0x61, 0x00);
  const boldOn  = () => push(ESC, 0x45, 0x01);
  const boldOff = () => push(ESC, 0x45, 0x00);
  const doubleHOn  = () => push(GS, 0x21, 0x01); // tinggi 2x, lebar normal (tidak wrap)
  const sizeNormal = () => push(GS, 0x21, 0x00);

  alignCenter();
  boldOn(); doubleHOn();
  text(STORE.name + '\n');
  sizeNormal(); boldOff();
  text(STORE.addr1 + '\n');
  text(STORE.addr2 + '\n');
  text('WhatsApp: ' + formatPhone(STORE.phone) + '\n');
  halfGap();

  text('TRANSAKSI BERHASIL\n');
  text(`${t.tgl} - ${t.jam} WIB\n`);
  halfGap();

  alignLeft();
  text(`No. Transaksi:\n`);
  text(`${t.trxId}`);


  alignCenter();
  boldOn();
  divider();
  text(t.jenisLabel.toUpperCase());
  divider();
  boldOff();

  alignLeft();
  t.detailFields.filter(f => f.value).forEach(f => text(twoCol(f.label, f.value)));
  if (t.namaPelanggan) text(twoCol('Pelanggan', t.namaPelanggan));

  text(twoCol('Nominal', rupiah(t.nominal)));
  text(twoCol('Biaya Admin', rupiah(t.admin)));

  doubleDivider();
  boldOn();
  text(twoCol(t.totalLabel, rupiah(t.total)));
  boldOff();
  doubleDivider();

  text(twoCol('Metode Bayar', t.metode));
  if (t.catatan) text(`Catatan: ${t.catatan}\n`);
  halfGap();

  return new Uint8Array(out);
}

async function printViaBluetooth(t){
  if(!navigator.bluetooth) throw new Error('Web Bluetooth tidak didukung browser ini');

  showStatus('Mencari printer Bluetooth di sekitar...', '');
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [SERVICE_UUID]
  });

  showStatus(`Menghubungkan ke "${device.name||'printer'}"...`, '');
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristic = await service.getCharacteristic(CHAR_UUID);

  showStatus('Menyiapkan struk...', '');
  const ESC = 0x1B, GS = 0x1D;
  const enc = new TextEncoder();
  const parts = [];

  parts.push(new Uint8Array([ESC, 0x40])); // init printer

  const HALF_GAP_DOTS = 12; // sama dengan di buildReceiptTextBytes

  try {
    const logoBitmap = await loadLogoBitmap(LOGO_WIDTH_DOTS, PAPER_WIDTH_DOTS);
    parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
    parts.push(buildEscPosRasterCommand(logoBitmap));
    parts.push(new Uint8Array([ESC, 0x4A, HALF_GAP_DOTS])); // jarak setengah baris ke nama toko
  } catch (e) {
    console.warn('Logo gagal dimuat, lanjut tanpa logo.', e);
  }

  parts.push(buildReceiptTextBytes(t));

  // Label "No. Referensi" ditambahkan di atas barcode biar jelas kegunaannya
  parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
  parts.push(enc.encode('No. Referensi\n'));
  parts.push(buildCode128Barcode(t.trxId));
  parts.push(enc.encode(t.trxId + '\n'));
  parts.push(new Uint8Array([ESC, 0x4A, HALF_GAP_DOTS]));
  parts.push(enc.encode('Nota sah tanpa tanda tangan\ndan cap basah\n'));
  parts.push(new Uint8Array([GS, 0x56, 0x42, 0x00])); // potong kertas, tanpa feed tambahan

  const total = parts.reduce((s, p) => s + p.length, 0);
  const bytes = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { bytes.set(p, off); off += p.length; }

  showStatus('Mengirim struk ke printer...', '');
  const CHUNK = 180; // batas aman untuk write BLE
  for(let i=0;i<bytes.length;i+=CHUNK){
    await characteristic.writeValue(bytes.slice(i,i+CHUNK));
  }
  showStatus('berhasil dikirim ke printer Bluetooth.', 'ok');
}

document.getElementById('btnCetak').addEventListener('click', async ()=>{
  if(!lastTrx){ alert('Susun Struk terlebih dahulu.'); return; }

  if(!navigator.bluetooth){
    window.print();
    return;
  }

  try{
    await printViaBluetooth(lastTrx);
  }catch(err){
    console.warn('Cetak Bluetooth gagal/dibatalkan, beralih ke print browser.', err);
    showStatus('Printer Bluetooth tidak tersambung, membuka dialog print browser sebagai cadangan.', '');
    window.print();
  }
});

/* ======================= KIRIM (SHARE KE WHATSAPP) ======================= */
document.getElementById('btnKirim').addEventListener('click', async ()=>{
  if(!lastTrx){ alert('Susun Struk terlebih dahulu.'); return; }

  showStatus('Menyiapkan gambar struk...', '');
  try{
    const receiptOuter = document.querySelector('.receipt-outer');
    const canvas = await html2canvas(receiptOuter, {backgroundColor:null, scale:2});

    canvas.toBlob(async (blob)=>{
      if(!blob){ showStatus('Gagal membuat gambar struk.', 'err'); return; }

      const fileName = lastTrx.trxId.replace(/\//g,'-') + '.png';
      const file = new File([blob], fileName, {type:'image/png'});
      const shareText = `STRUK ${STORE.name}\n${lastTrx.trxId}\n${lastTrx.totalLabel}: ${rupiah(lastTrx.total)}`;

      const canShareFile = navigator.canShare && navigator.canShare({files:[file]});

      if(navigator.share && canShareFile){
        try{
          await navigator.share({files:[file], title:'Struk Digital', text: shareText});
          showStatus('Struk berhasil dibagikan.', 'ok');
        }catch(err){
          if(err.name !== 'AbortError'){
            showStatus('Gagal membagikan struk: '+(err.message||err), 'err');
          }else{
            hideStatus();
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);

        const waUrl = 'https://wa.me/?text=' + encodeURIComponent(
          shareText + ''
        );
        window.open(waUrl, '_blank');
        showStatus('');
      }
    }, 'image/png');
  }catch(err){
    console.error(err);
    showStatus('Gagal menyiapkan gambar struk: '+(err.message||err), 'err');
  }
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

const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz_RMwb-w5rWxn_rIXD4shXGJ9viyGV2A9GdEwqTFwC6Sy04d1z-DUoGJ8btMw2kCfv/exec';

document.getElementById('btnCatat').addEventListener('click', async ()=>{
  if(!lastTrx) return;

  const list = getHist();
  list.unshift(lastTrx);
  saveHist(list);
  renderHist();

  if(!SHEET_WEBHOOK_URL){
    showStatus('Transaksi disimpan ke riwayat perangkat ini. (Google Sheet belum disetel — isi SHEET_WEBHOOK_URL di main.js)', '');
    return;
  }

  showStatus('Menyimpan ke riwayat & mengirim ke Google Sheet...', '');
  try{
    await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type': 'text/plain'},
      body: JSON.stringify(lastTrx)
    });
    showStatus('Transaksi disimpan ke riwayat & Google Sheet.', 'ok');
  }catch(err){
    console.error(err);
    showStatus('Tersimpan ke riwayat perangkat, tapi gagal mengirim ke Google Sheet.', 'err');
  }
});

renderHist();
