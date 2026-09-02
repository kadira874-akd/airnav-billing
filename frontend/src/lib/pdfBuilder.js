// ============================================================
// PDF BUILDER — generate full HTML (invoice + kwitansi) dari
// flight record + data pendukung, lalu download sebagai PDF
// memakai html2canvas + jsPDF.
// ============================================================
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ────────────────────────────────────────────────────────────
// CSS DOKUMEN (A4)
// ────────────────────────────────────────────────────────────
export const DOC_INV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'IBM Plex Sans', -apple-system, Segoe UI, sans-serif;
    color: #0D2451;
    background: #fff;
    font-size: 11pt;
    line-height: 1.45;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 15mm 12mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
  }

  /* ── ID STRIP ── */
  .id-strip {
    display: flex;
    align-items: center;
    background: #0D2451;
    color: #fff;
    border-radius: 8px;
    padding: 5mm 6mm;
    margin-bottom: 5mm;
    gap: 4mm;
    font-size: 12pt;
    font-weight: 700;
    letter-spacing: .3px;
  }
  .id-strip-red {
    background: linear-gradient(135deg, #C8102E, #8C0B22);
  }
  .id-strip .id-tag {
    background: #2555B4;
    color: #fff;
    padding: 2px 3mm;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1px;
    font-family: 'IBM Plex Mono', monospace;
  }
  .id-strip-red .id-tag { background: rgba(255,255,255,.18); }
  .id-strip .id-no {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13pt;
    font-weight: 600;
  }
  .id-strip .spacer { flex: 1; }
  .id-strip .id-date {
    font-size: 9pt;
    font-weight: 500;
    opacity: .85;
    font-family: 'IBM Plex Mono', monospace;
  }

  /* ── MASTHEAD ── */
  .masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 4mm;
    border-bottom: 2px solid #0D2451;
    margin-bottom: 5mm;
  }
  .logo-block {
    display: flex;
    align-items: center;
    gap: 3mm;
  }
  .logo-block .logo-img {
    width: 14mm;
    height: 14mm;
    border-radius: 6px;
    object-fit: contain;
  }
  .logo-block .org-primary {
    font-family: 'Playfair Display', serif;
    font-size: 15pt;
    font-weight: 800;
    color: #0D2451;
    line-height: 1.1;
  }
  .logo-block .org-secondary {
    font-size: 8.5pt;
    font-weight: 600;
    color: #2555B4;
    letter-spacing: .5px;
  }
  .logo-block .org-tertiary {
    font-size: 7.5pt;
    color: #4a5a80;
    line-height: 1.3;
    margin-top: 1mm;
  }
  .ref-block {
    text-align: right;
    font-size: 9pt;
  }
  .ref-block .ref-label {
    font-size: 8pt;
    font-weight: 700;
    color: #2555B4;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .ref-block .ref-number {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13pt;
    font-weight: 600;
    color: #0D2451;
    margin: 1mm 0;
  }
  .ref-block .ref-date {
    font-size: 8.5pt;
    color: #4a5a80;
    font-family: 'IBM Plex Mono', monospace;
  }

  /* ── TITLE ── */
  .title-section { text-align: center; margin-bottom: 5mm; }
  .title-org {
    font-family: 'Playfair Display', serif;
    font-size: 11pt;
    font-weight: 700;
    color: #2555B4;
    letter-spacing: 2px;
  }
  .title-full {
    font-family: 'Playfair Display', serif;
    font-size: 21pt;
    font-weight: 800;
    color: #0D2451;
    letter-spacing: .5px;
  }
  .title-type-inv {
    display: inline-block;
    background: #2555B4;
    color: #fff;
    padding: 1mm 5mm;
    border-radius: 4px;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 2mm;
  }
  .title-type-kwt {
    display: inline-block;
    background: #C8102E;
    color: #fff;
    padding: 1mm 5mm;
    border-radius: 4px;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 2mm;
  }

  /* ── BODY ── */
  .body-outer { flex: 1; }

  /* ── FIELDS ── */
  .fields-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4mm;
  }
  .fields-table td {
    padding: 1.6mm 2mm;
    font-size: 9.5pt;
    vertical-align: top;
  }
  .fields-table .f-label {
    width: 34%;
    color: #2555B4;
    font-weight: 700;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: .4px;
    white-space: nowrap;
  }
  .fields-table .f-value {
    color: #0D2451;
    font-weight: 600;
  }
  .fields-table tr { border-bottom: 1px solid #e4e9f2; }
  .fields-table tr:last-child { border-bottom: none; }

  /* ── CHARGES ── */
  .charges-section { margin-bottom: 5mm; }
  .charges-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  .charges-tbl thead th {
    background: #0D2451;
    color: #fff;
    padding: 2mm 2mm;
    text-align: left;
    font-weight: 600;
    font-size: 8pt;
    letter-spacing: .3px;
  }
  .charges-tbl thead th.r, .charges-tbl tbody td.r, .charges-tbl tfoot td.r { text-align: right; }
  .charges-tbl tbody td {
    padding: 2mm;
    border-bottom: 1px solid #e4e9f2;
    vertical-align: top;
  }
  .charges-tbl tbody tr:nth-child(even) { background: #f5f8ff; }
  .charges-tbl tfoot td {
    padding: 2mm;
    border-top: 2px solid #0D2451;
    font-weight: 700;
    background: #eaf0ff;
  }
  .charges-tbl .num, .charges-tbl .money { font-family: 'IBM Plex Mono', monospace; }

  /* ── SUMMARY ── */
  .summary-block {
    border: 1.5px solid #0D2451;
    border-radius: 6px;
    margin-bottom: 5mm;
  }
  .summary-block .s-row {
    display: flex;
    justify-content: space-between;
    padding: 2mm 3.5mm;
    font-size: 9.5pt;
    border-bottom: 1px solid #e4e9f2;
  }
  .summary-block .s-row .s-label { color: #4a5a80; font-weight: 600; }
  .summary-block .s-row .s-val {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    color: #0D2451;
  }
  .summary-block .s-row:last-child { border-bottom: none; }
  .summary-block .s-row.total {
    background: #0D2451;
    color: #fff;
    border-radius: 0 0 5px 5px;
    padding: 2.5mm 3.5mm;
  }
  .summary-block .s-row.total .s-label { color: #fff; font-weight: 700; font-size: 10pt; }
  .summary-block .s-row.total .s-val { color: #fff; font-weight: 800; font-size: 11.5pt; }

  /* ── NOTE ── */
  .note-box {
    background: #f5f8ff;
    border-left: 3mm solid #2555B4;
    padding: 2.5mm 3mm;
    margin-bottom: 5mm;
    font-size: 8pt;
    color: #4a5a80;
    border-radius: 0 4px 4px 0;
  }

  /* ── BANK ── */
  .bank-card {
    border: 1.5px solid #2555B4;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 5mm;
  }
  .bank-stripe {
    background: #2555B4;
    color: #fff;
    padding: 1.6mm 3mm;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: .5px;
  }
  .bank-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3mm;
    padding: 2.5mm 3mm;
  }
  .bank-field { font-size: 8.5pt; }
  .bank-field .bf-label {
    display: block;
    font-size: 7pt;
    color: #7a88ad;
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  .bank-field .bf-value {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    color: #0D2451;
    font-size: 10pt;
  }
  .bank-badge {
    margin-left: auto;
    background: #0D2451;
    color: #fff;
    padding: 1.5mm 3mm;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: .5px;
  }

  /* ── SIGN ── */
  .sign-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4mm;
  }
  .sign-block {
    text-align: center;
    width: 60mm;
  }
  .sign-block .sign-title {
    font-size: 9pt;
    font-weight: 700;
    color: #0D2451;
    margin-bottom: 2mm;
  }
  .sign-block .sign-qr {
    width: 22mm;
    height: 22mm;
    margin: 0 auto 1mm;
  }
  .sign-block .sign-qr img, .sign-block .sign-qr svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .sign-block .sign-line {
    border-top: 1px solid #0D2451;
    margin: 2mm 10mm;
  }
  .sign-block .sign-name {
    font-weight: 700;
    font-size: 10pt;
    color: #0D2451;
  }
  .sign-block .sign-nip {
    font-size: 8pt;
    color: #4a5a80;
    font-family: 'IBM Plex Mono', monospace;
  }
  .sign-block .sign-pos {
    font-size: 8pt;
    color: #2555B4;
    margin-bottom: 4mm;
  }

  /* ── CC BLOCK ── */
  .cc-block {
    display: flex;
    gap: 3mm;
    font-size: 7pt;
    color: #7a88ad;
    margin-bottom: 3mm;
  }
  .cc-block .cc-item .cc-label { font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }

  /* ── ID BAR BOTTOM ── */
  .id-bar-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid #0D2451;
    padding-top: 2mm;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    color: #4a5a80;
  }
  .id-bar-bottom .b-no { font-weight: 700; color: #0D2451; }

  /* ── KWT HERO ── */
  .kwt-hero {
    background: linear-gradient(135deg, #0D2451, #2555B4);
    color: #fff;
    border-radius: 8px;
    padding: 5mm 6mm;
    margin-bottom: 5mm;
  }
  .kwt-from-label {
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    opacity: .8;
  }
  .kwt-from-name {
    font-family: 'Playfair Display', serif;
    font-size: 16pt;
    font-weight: 800;
  }
  .kwt-amount-block {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 3mm;
  }
  .kwt-amount-block .kwt-amount {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 20pt;
    font-weight: 800;
  }
  .kwt-amount-block .kwt-cur {
    font-size: 8pt;
    opacity: .85;
    letter-spacing: .5px;
  }
  .kwt-terbilang {
    font-size: 9pt;
    font-style: italic;
    color: #2555B4;
    margin-bottom: 4mm;
  }
`;

// ────────────────────────────────────────────────────────────
// FORMATTER
// ────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function toMin(t) {
  if (t == null || t === '') return 0;
  if (t instanceof Date) return t.getHours() * 60 + t.getMinutes();
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
}

function fmtIDRn(v) {
  return 'Rp ' + num(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUSD(v) {
  return num(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ────────────────────────────────────────────────────────────
// SVG → DATA URI (anti-crash, hanya karakter aman untuk btoa)
// ────────────────────────────────────────────────────────────
function svgToDataUri(svg) {
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch (e) {
    try {
      return 'data:image/svg+xml;base64,' + btoa(svg);
    } catch (e2) {
      return '';
    }
  }
}

const FALLBACK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0D2451"/><g fill="#fff"><path d="M32 14l-6 18h12z" opacity=".55"/><path d="M20 34l26-2-8 18z"/><path d="M24 14l4 2-1 8-4-2z" opacity=".8"/></g><circle cx="50" cy="14" r="6" fill="#C8102E"/></svg>`;

const FALLBACK_QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#fff"/><g fill="#0D2451"><path d="M8 8h24v24H8zM64 8h24v24H64zM8 64h24v24H8z"/><path d="M14 14h12v12H14zM70 14h12v12H70zM14 70h12v12H14z"/></g><rect x="8" y="40" width="8" height="8" fill="#0D2451"/><rect x="20" y="40" width="8" height="8" fill="#2555B4"/><rect x="40" y="8" width="8" height="8" fill="#2555B4"/><rect x="52" y="8" width="8" height="8" fill="#0D2451"/><rect x="64" y="40" width="8" height="8" fill="#0D2451"/><rect x="40" y="24" width="8" height="8" fill="#0D2451"/><rect x="32" y="40" width="16" height="8" fill="#C8102E"/><rect x="40" y="56" width="8" height="8" fill="#0D2451"/><rect x="56" y="56" width="16" height="16" fill="#2555B4"/><rect x="76" y="60" width="12" height="12" fill="#0D2451"/><rect x="56" y="80" width="8" height="8" fill="#0D2451"/></svg>`;

function fallbackLogo() {
  return `${esc(svgToDataUri(FALLBACK_LOGO_SVG))}`;
}

// ────────────────────────────────────────────────────────────
// DATA RESOLVER (shared logika buildDocHTML)
// ────────────────────────────────────────────────────────────
function resolveData(rec, previewData) {
  const cfg = previewData?.cfgRes?.data || {};
  const config = cfg.config || cfg;
  const signRes = previewData?.signRes?.data || {};
  const bankRes = previewData?.bankRes?.data || null;
  const airlines = previewData?.airlineRes?.data || [];
  const aptHours = previewData?.aptRes?.data || [];
  const exRates = previewData?.exRateRes?.data || [];

  // 1. Signatory: dari snapshot JSON, fallback signRes
  let sign = {};
  if (rec.signatorySnapshot) {
    try {
      const parsed = typeof rec.signatorySnapshot === 'string' ? JSON.parse(rec.signatorySnapshot) : rec.signatorySnapshot;
      if (parsed && typeof parsed === 'object') {
        sign = {
          name: parsed.name || parsed.nama || '',
          position: parsed.position || parsed.jabatan || '',
          nip: parsed.nip || parsed.NIP || '',
          qrcodeBase64: parsed.qrcodeBase64 || parsed.qr || '',
        };
      }
    } catch (e) { sign = {}; }
  }
  if (!sign.name) {
    sign = {
      name: signRes.name || signRes.nama || '',
      position: signRes.position || signRes.jabatan || '',
      nip: signRes.nip || '',
      qrcodeBase64: signRes.qrcodeBase64 || '',
    };
  }

  // 2. Airline
  const acidPrefix = String(rec.acid || '').trim().slice(0, 3).toUpperCase();
  const airline = airlines.find((a) => String(a.airlineCode || '').toUpperCase() === acidPrefix) || {};

  // 3. Kurs
  const isInt = rec.domInt === 'INTERNATIONAL';
  let kurs = isInt ? num(rec.kursUsed) : 1;
  if (isInt && !kurs) {
    const flightKey = fmtDateShort(rec.flightDate);
    const matched = exRates.find((r) => {
      const rDate = fmtDateShort(r.updatedAt || r.date);
      return (!r.currency || r.currency === 'USD') && (rDate === flightKey || !r.updatedAt);
    }) || exRates.find((r) => !r.currency || r.currency === 'USD');
    kurs = num(matched?.rate);
  }
  if (isInt && !kurs) kurs = num(config.exchangeRate);
  if (!kurs) kurs = 1;

  // 4/5. Airport rule + charge start/end
  const apt = aptHours.find((a) => String(a.airportCode || '').toUpperCase() === String(rec.unitCode || '').toUpperCase()) || {};
  const cat = String(rec.category || '').toUpperCase();
  let chargeStart, chargeEnd;
  if (cat === 'EXTEND') {
    chargeStart = toMin(apt.normalEnd);
    chargeEnd = toMin(rec.atd || rec.ata);
  } else {
    chargeStart = toMin(rec.atd || rec.ata);
    chargeEnd = toMin(apt.normalStart);
  }
  let durMin = chargeEnd - chargeStart;
  if (durMin < 0) durMin += 1440;
  const durHours = durMin / 60;

  // 6. Amounts
  const gross = num(rec.grossAmount);
  const dpp = num(rec.grossAmount);
  const vatPct = num(rec.vatPctSnapshot ?? config.vat_percent);
  const pphPct = num(rec.pphPctSnapshot ?? config.pph_percent);
  const vatAmount = num(rec.vatAmount) || (gross * vatPct / 100);
  const pphAmount = num(rec.pphAmount) || (gross * pphPct / 100);
  const totalAmount = num(rec.totalAmount) || (gross + vatAmount - pphAmount);

  // 7. Rate
  const rateVal = num(rec.rateUsed) || (durHours > 0 ? gross / durHours : gross);

  // 9. Kwitansi nomor
  const kwNo = rec.invoiceNo || '';

  return {
    cfg: config,
    companyName: esc(config.company_name || 'AIRNAV INDONESIA'),
    companyAddress: esc(config.company_address || ''),
    sign,
    airline,
    kurs,
    isInt,
    apt,
    cat,
    durHours,
    durMin,
    gross, dpp, vatPct, pphPct, vatAmount, pphAmount, totalAmount, rateVal,
    kwNo,
    bank: bankRes,
    logoUri: fallbackLogo(),
  };
}

function resolveQr(sign) {
  if (sign.qrcodeBase64) {
    const qr = String(sign.qrcodeBase64);
    return `<img src="${esc(qr.startsWith('data:') ? qr : 'data:image/png;base64,' + qr)}" alt="QR" />`;
  }
  return `<img src="${esc(svgToDataUri(FALLBACK_QR_SVG))}" alt="QR" />`;
}

function mastheadHTML(cfg, logoUri, refNo, refDate, idLabel, idClass, idNo, docDate) {
  return `
    <div class="${idClass}">
      <span class="id-tag">${esc(idLabel)}</span>
      <span class="id-no">${esc(idNo)}</span>
      <span class="spacer"></span>
      <span class="id-date">${esc(docDate)}</span>
    </div>
    <div class="masthead">
      <div class="logo-block">
        <img class="logo-img" src="${logoUri}" alt="logo" />
        <div>
          <div class="org-primary">${esc(cfg.company_name || 'AIRNAV INDONESIA')}</div>
          <div class="org-secondary">PERUM LPPNPI · AIR NAVIGATION INDONESIA</div>
          <div class="org-tertiary">${esc(cfg.company_address || '')}</div>
        </div>
      </div>
      <div class="ref-block">
        <div class="ref-label">No</div>
        <div class="ref-number">${esc(refNo)}</div>
        <div class="ref-date">${esc(refDate)}</div>
      </div>
    </div>`;
}

function signRowHTML(sign) {
  return `
    <div class="sign-row">
      <div class="sign-block">
        <div class="sign-title">Mengetahui,<br/>${esc(sign.position || '')}</div>
        <div class="sign-qr">${resolveQr(sign)}</div>
        <div class="sign-line"></div>
        <div class="sign-name">${esc(sign.name || '')}</div>
        <div class="sign-nip">NIP. ${esc(sign.nip || '—')}</div>
      </div>
    </div>`;
}

function ccBlockHTML(isInt) {
  const cc1 = isInt
    ? '<div class="cc-item"><span class="cc-label">Kurs USD/IDR:</span> —</div>'
    : '';
  return `
    <div class="cc-block">
      <div class="cc-item"><span class="cc-label">Subjek Pajak:</span> Perum LPPNPI</div>
      ${cc1}
    </div>`;
}

function bankCardHTML(bank, cfg) {
  if (Array.isArray(bank) && bank.length) {
    const b = bank.find((x) => x.isDefault) || bank[0];
    return `
      <div class="bank-card">
        <div class="bank-stripe">PEMBAYARAN / BANK TRANSFER</div>
        <div class="bank-fields">
          <div class="bank-field">
            <span class="bf-label">Bank</span>
            <span class="bf-value">${esc(b.bankName || '')}</span>
          </div>
          <div class="bank-field">
            <span class="bf-label">No. Rekening</span>
            <span class="bf-value">${esc(b.accountNumber || '')}</span>
          </div>
          <div class="bank-field">
            <span class="bf-label">Atas Nama</span>
            <span class="bf-value">${esc(b.accountName || '')}</span>
          </div>
          <div class="bank-field">
            <span class="bf-label">Cabang</span>
            <span class="bf-value">${esc(b.branch || '')}</span>
          </div>
          <span class="bank-badge">UTAMA</span>
        </div>
      </div>`;
  }
  return `
    <div class="bank-card">
      <div class="bank-stripe">PEMBAYARAN / BANK TRANSFER</div>
      <div class="bank-fields">
        <div class="bank-field">
          <span class="bf-label">No. Rekening</span>
          <span class="bf-value">—</span>
        </div>
      </div>
    </div>`;
}

// ────────────────────────────────────────────────────────────
// BUILD INVOICE HTML
// ────────────────────────────────────────────────────────────
export function buildInvoiceHTML(rec, previewData) {
  const d = resolveData(rec, previewData);
  const airlineName = esc(d.airline.airlineName || d.airline.operator || '');
  const typeLabel = d.cat === 'EXTEND' ? 'EXTEND CHARGES' : 'ADVANCE CHARGES';
  const flightDate = fmtDateShort(rec.flightDate);
  const route = `${esc(rec.adep || '')} – ${esc(rec.ades || '')}`;
  const time = `${esc(rec.atd || '')} / ${esc(rec.ata || '')}`;
  const domInt = rec.domInt === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIK';
  const rateStr = fmtIDRn(d.rateVal);
  const grossUSD = d.isInt ? d.gross / d.kurs : 0;

  const invoiceAmountUSD = fmtUSD(grossUSD);
  const grossStr = 'Rp ' + d.gross.toLocaleString('id-ID', { minimumFractionDigits: 2 });
  const dppStr = 'Rp ' + d.dpp.toLocaleString('id-ID', { minimumFractionDigits: 2 });
  const vatStr = 'Rp ' + d.vatAmount.toLocaleString('id-ID', { minimumFractionDigits: 2 });
  const pphStr = 'Rp ' + d.pphAmount.toLocaleString('id-ID', { minimumFractionDigits: 2 });
  const totalStr = 'Rp ' + d.totalAmount.toLocaleString('id-ID', { minimumFractionDigits: 2 });

  const fields = [
    ['AIRLINE', airlineName],
    ['GROUND HANDLING', 'AIRNAV INDONESIA'],
    ['FLIGHT NUMBER', esc(rec.acid || '')],
    ['REGISTRATION', esc(rec.registration || '')],
    ['AIRCRAFT TYPE', esc(rec.aircraftType || '')],
    ['FLIGHT DATE', flightDate],
    ['ROUTE', route],
    ['TIME (ATD / ATA)', time],
    ['DOM / INT', domInt],
    ['CATEGORY', esc(rec.category || '')],
  ];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(rec.invoiceNo || '')}</title>
  <style>${DOC_INV_CSS}</style>
</head>
<body>
  <div class="page">
    ${mastheadHTML(d.cfg, d.logoUri, rec.invoiceNo || '', flightDate, 'INVOICE', 'id-strip', rec.invoiceNo || '—', flightDate)}

    <div class="title-section">
      <div class="title-org">AIRNAV INDONESIA</div>
      <div class="title-full">INVOICE</div>
      <div class="title-type-inv">${typeLabel}</div>
    </div>

    <div class="body-outer">
      <table class="fields-table">
        ${fields.map(([l, v]) => `<tr><td class="f-label">${l}</td><td class="f-value">${v}</td></tr>`).join('')}
      </table>

      <div class="charges-section">
        <table class="charges-tbl">
          <thead>
            <tr>
              <th>No.</th>
              <th>Description</th>
              <th>From</th>
              <th>To</th>
              <th>Duration</th>
              <th class="r">Rate</th>
              <th class="r">Amount IDR</th>
              <th class="r">Amount USD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${typeLabel} ${esc(rec.acid || '')} — ${route}</td>
              <td>${esc(d.apt.normalStart != null ? d.apt.normalStart : '')}</td>
              <td>${esc(rec.atd || rec.ata || '')}</td>
              <td>${d.durHours.toFixed(2)} hrs</td>
              <td class="r num">${rateStr}</td>
              <td class="r num money">${grossStr}</td>
              <td class="r num money">${invoiceAmountUSD}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7" class="r">Subtotal (Gross)</td>
              <td class="r num money">${invoiceAmountUSD}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="summary-block">
        <div class="s-row"><span class="s-label">Subtotal / DPP</span><span class="s-val">${dppStr}</span></div>
        <div class="s-row"><span class="s-label">PPN (${d.vatPct}%)</span><span class="s-val">${vatStr}</span></div>
        <div class="s-row"><span class="s-label">PPh (${d.pphPct}%)</span><span class="s-val">${pphStr}</span></div>
        <div class="s-row"><span class="s-label">Jumlah</span><span class="s-val">${(d.dpp + d.vatAmount - d.pphAmount).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></div>
        <div class="s-row total"><span class="s-label">TOTAL BAYAR</span><span class="s-val">${totalStr}</span></div>
      </div>

      <div class="note-box">
        Invoice ini merupakan tagihan atas jasa pelayanan navigasi penerbangan. Pembayaran dilakukan melalui transfer bank
        ke rekening resmi Perum LPPNPI sebelum batas waktu yang ditentukan.
        Mohon mencantumkan Nomor Invoice pada referensi pembayaran.
      </div>

      ${bankCardHTML(d.bank, d.cfg)}

      ${signRowHTML(d.sign)}
      ${ccBlockHTML(d.isInt)}
    </div>

    <div class="id-bar-bottom">
      <span class="b-no">${esc(rec.invoiceNo || '')}</span>
      <span>Dokumen ini sah tanpa tanda tangan karena menggunakan QR Code.</span>
      <span>${esc(d.kwtNo || '')}</span>
    </div>
  </div>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// BUILD KWITANSI HTML
// ────────────────────────────────────────────────────────────
export function buildKwitansiHTML(rec, previewData) {
  const d = resolveData(rec, previewData);
  const airlineName = esc(d.airline.airlineName || d.airline.operator || '');
  const flightDate = fmtDateShort(rec.flightDate);
  const route = `${esc(rec.adep || '')} – ${esc(rec.ades || '')}`;

  let grossStr, dppStr, vatStr, pphStr, totalStr, cur;
  if (d.isInt && d.kurs > 0) {
    cur = 'USD';
    grossStr = fmtUSD(d.gross / d.kurs);
    dppStr = fmtUSD(d.dpp / d.kurs);
    vatStr = fmtUSD(d.vatAmount / d.kurs);
    pphStr = fmtUSD(d.pphAmount / d.kurs);
    totalStr = fmtUSD(d.totalAmount / d.kurs);
  } else {
    cur = 'IDR';
    grossStr = fmtIDRn(d.gross);
    dppStr = fmtIDRn(d.dpp);
    vatStr = fmtIDRn(d.vatAmount);
    pphStr = fmtIDRn(d.pphAmount);
    totalStr = fmtIDRn(d.totalAmount);
  }

  const fields = [
    ['NAMA', airlineName],
    ['NOMOR PENERBANGAN', esc(rec.acid || '')],
    ['RUTE', route],
    ['TANGGAL', flightDate],
    ['KATEGORI', esc(rec.category || '')],
    ['DURASI', `${d.durHours.toFixed(2)} hrs`],
  ];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kwitansi ${esc(rec.invoiceNo || '')}</title>
  <style>${DOC_INV_CSS}</style>
</head>
<body>
  <div class="page">
    ${mastheadHTML(d.cfg, d.logoUri, rec.invoiceNo || '', flightDate, 'KWITANSI', 'id-strip id-strip-red', rec.invoiceNo || '—', flightDate)}

    <div class="title-section">
      <div class="title-org">AIRNAV INDONESIA</div>
      <div class="title-full">KWITANSI</div>
      <div class="title-type-kwt">TANDA TERIMA PEMBAYARAN</div>
    </div>

    <div class="kwt-hero">
      <div class="kwt-from-label">Telah diterima dari</div>
      <div class="kwt-from-name">${airlineName || '—'}</div>
      <div class="kwt-amount-block">
        <span class="kwt-amount">${totalStr}</span>
        <span class="kwt-cur">${cur}</span>
      </div>
    </div>

    <div class="kwt-terbilang">Terbilang: ${esc(spellout(d.totalAmount))} rupiah</div>

    <table class="fields-table">
      ${fields.map(([l, v]) => `<tr><td class="f-label">${l}</td><td class="f-value">${v}</td></tr>`).join('')}
    </table>

    <div class="summary-block">
      <div class="s-row"><span class="s-label">Gross</span><span class="s-val">${grossStr}</span></div>
      <div class="s-row"><span class="s-label">DPP</span><span class="s-val">${dppStr}</span></div>
      <div class="s-row"><span class="s-label">PPN (${d.vatPct}%)</span><span class="s-val">${vatStr}</span></div>
      <div class="s-row"><span class="s-label">PPh (${d.pphPct}%)</span><span class="s-val">${pphStr}</span></div>
      <div class="s-row total"><span class="s-label">TOTAL</span><span class="s-val">${totalStr}</span></div>
    </div>

    ${bankCardHTML(d.bank, d.cfg)}
    ${signRowHTML(d.sign)}
    ${ccBlockHTML(d.isInt)}

    <div class="id-bar-bottom">
      <span class="b-no">${esc(rec.invoiceNo || '')}</span>
      <span>Kwitansi sah tanpa tanda tangan karena menggunakan QR Code.</span>
      <span>${esc(flightDate)}</span>
    </div>
  </div>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// TERBILANG (angka → kata, IDR)
// ────────────────────────────────────────────────────────────
const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
function spellout(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Nol';
  if (n < 12) return SATUAN[n];
  if (n < 20) return spellout(n - 10) + ' Belas';
  if (n < 100) return spellout(Math.floor(n / 10)) + ' Puluh ' + spellout(n % 10);
  if (n < 200) return 'Seratus ' + spellout(n - 100);
  if (n < 1000) return spellout(Math.floor(n / 100)) + ' Ratus ' + spellout(n % 100);
  if (n < 2000) return 'Seribu ' + spellout(n - 1000);
  if (n < 1000000) return spellout(Math.floor(n / 1000)) + ' Ribu ' + spellout(n % 1000);
  if (n < 1000000000) return spellout(Math.floor(n / 1000000)) + ' Juta ' + spellout(n % 1000000);
  return 'Lebih dari 1 Miliar';
}

// ────────────────────────────────────────────────────────────
// DOWNLOAD COMBINED PDF
// ────────────────────────────────────────────────────────────
export async function downloadCombinedPdf(rec, previewData) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;width:210mm;height:297mm;border:none';
  document.body.appendChild(iframe);

  const isPaid = rec.statusFlow === 'PAID';
  const invoiceHTML = buildInvoiceHTML(rec, previewData);
  const kwitansiHTML = isPaid ? buildKwitansiHTML(rec, previewData) : null;

  iframe.srcdoc = invoiceHTML;
  await new Promise((r) => (iframe.onload = r));
  await new Promise((r) => setTimeout(r, 500));

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const invoiceCanvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, scale: 2 });
  const invoiceImg = invoiceCanvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(invoiceImg, 'JPEG', 0, 0, 210, 297);

  if (kwitansiHTML) {
    iframe.srcdoc = kwitansiHTML;
    await new Promise((r) => (iframe.onload = r));
    await new Promise((r) => setTimeout(r, 500));
    doc.addPage();
    const kwCanvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, scale: 2 });
    const kwImg = kwCanvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(kwImg, 'JPEG', 0, 0, 210, 297);
  }

  doc.save(`Dokumen_${rec.invoiceNo || rec.acid || rec.rowId}.pdf`);
  document.body.removeChild(iframe);
}

export { buildInvoiceHTML as buildHtml };
export default { buildInvoiceHTML, buildKwitansiHTML, downloadCombinedPdf };
