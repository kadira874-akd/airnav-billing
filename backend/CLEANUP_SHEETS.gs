/* ═══════════════════════════════════════════════════════════════
   CLEANUP_SHEETS.gs — Eliminasi Sheet & Kolom (TANPA HAPUS DATA)

   Buang kolom yang tidak dibutuhkan, buang sheet yang tidak dikenal,
   PERTAHANKAN semua data pada kolom/sheet yang dipertahankan.

   CARA PAKAI:
   1. Tempel file ini ke project Apps Script.
   2. Jalankan  previewCleanup()   → baca LOG: daftar kolom & sheet yang akan dihapus.
   3. Setuju? Jalankan executeCleanup().
   4. Sudah DOK terlanjur dihapus kolom yang dipakai kode lagi?
      Kolom PENULIS yang dibuang harus disesuaikan di code.gs — lihat
      bagian "EDIT PENYERTA MENYUSUL" di akhir file ini.

   ⚠️ deleteColumns() / deleteSheet() TIDAK bisa undo.
      Backup dulu: File > Make a copy di Spreadsheet ATAU jalankan
      backupSpreadsheetForCleanup() (butuh scope Drive — opsional).

   PERINGATAN PENJAGAAN DATA:
   - Data pada kolom yang DIHAPUS ikut terhapus (sifat fisik Spreadsheet).
   - Data pada kolom yang DIpertahankan TIDAK tersentuh.
   - Kolom dengan header KOSONG TIDAK dihapus (dilewati + dicatat) —
     dianggap data tak berlabel yang mungkin penting.
   ═══════════════════════════════════════════════════════════════ */

// ── KONFIGURASI: SESUAIKAN SEBELUM EKSEKUSI ────────────────────
const CLEANUP = {
  // Kolom yang DIPERTAHANKAN per sheet (case-insensitive).
  // Kolom lain di sheet ini akan DIHAPUS.
  COLUMNS: {
    "Flights": [
      "unitCode","flightDate","acid","registration","aircraftType",
      "adep","ades","dep_arr_loc","atd","ata","statusFlight",
      "category","duration","domInt","statusFlow","invoiceNo",
      "grossAmount","vatAmount","pphAmount","totalAmount",
      "rateUsed","kursUsed","vatPctSnapshot","pphPctSnapshot",
      "validatedAt","validatedBy","signatorySnapshot",
      "receiptDate","createdAt","updatedAt","updatedBy","isDeleted","batchId"
    ],
    "Master_Airline": [
      "airlineCode","operator","airlineName","waNumber","email","isDeleted"
    ],
    "Master_Rate": [
      "unitCode","service","domInt","rateIDR","rateUSD","isDeleted"
    ],
    "Master_User": [
      "username","passwordHash","fullName","unitCode","isActive",
      "createdAt","updatedAt"
    ],
    "Master_Config": [
      "configKey","configValue","description"
    ],
    "Master_BankAccount": [
      "unitCode","bankName","branch","accountName","accountNumber",
      "isDefault","isDeleted"
    ],
    "Master_Signatory": [
      "unitCode","name","position","nip","qrcodeBase64",
      "isActive","updatedAt","updatedBy"
    ],
    "Master_AirportHours": [
      "airportCode","airportName","normalStart","normalEnd",
      "minDuration","isActive"
    ],
    "Master_ExchangeRate": [
      "currency","rate","source","updatedAt","updatedBy"
    ],
    "Master_Sequence": [
      "unitCode","tahun","bulan","lastNumber","updatedBy","updatedAt"
    ],
    "Invoice_Settings": [
      "settingKey","settingValue","description"
    ],
    "Audit_Log": [
      "timestamp","userId","action","tableName","recordId","newValue"
    ],
    "Doc_ShareTokens": [
      "token","rowId","expiresAt","revoked"
    ],
    "Doc_Batch": [
      "batchId","unitCode","rowIds","operatorName","airlineCode",
      "token","status","grandTotal",
      "proofFileUrl","proofFileId","proofNote","proofUploadedAt",
      "verifiedBy","verifiedAt",
      "rejectedBy","rejectedAt","rejectReason","rejectCategory",
      "reuploadCount","expiresAt","revoked"
    ],
  },

  // Sheet yang dihapus TOTAL (datanya ikut hilang!).
  // Kosongkan [] jika mau dipertahankan.
  // Lance: Invoice_Settings saat ini TIDAK dipakai frontend.
  DROP_SHEETS: ["Invoice_Settings"],

  // Sheet yang tidak terdaftar di COLUMNS dan bukan DROP_SHEETS
  // (mis. Master_Unit, sheet cadangan) → ikut dihapus total.
  // false = dibiarkan & hanya dilaporkan.
  DROP_UNKNOWN_SHEETS: true,
};

// ── HELPER ─────────────────────────────────────────────────────
function _normalize(s) {
  return String(s || '').trim().toLowerCase();
}

/**
 * Susun rencana cleanup tanpa mengeksekusi apa pun.
 * @returns {Object} plan berisi { drops:[], cols:[{sheet,blobs:[{start,count}]}], untitled:[] }
 */
function _collectCleanupPlan() {
  const plan = { drops: [], cols: [], untitled: [], missing: [] };
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const dropKeys = (CLEANUP.DROP_SHEETS || []).map(_normalize);
  const columnKeys = {};
  Object.keys(CLEANUP.COLUMNS).forEach(function (name) { columnKeys[_normalize(name)] = name; });

  ss.getSheets().forEach(function (sh) {
    const nm = sh.getName();
    const key = _normalize(nm);

    // 1) Sheet yang tegas mau dihapus total
    if (dropKeys.indexOf(key) !== -1) { plan.drops.push(nm); return; }

    // 2) Sheet tidak dikenal
    if (!(key in columnKeys)) {
      if (CLEANUP.DROP_UNKNOWN_SHEETS) plan.drops.push(nm);
      else plan.untitled.push('SHEET tak dikenal (dibiarkan): ' + nm);
      return;
    }

    // 3) Sheet dikenal → sisir kolom
    const keep = CLEANUP.COLUMNS[columnKeys[key]].map(_normalize);
    const lastCol = sh.getLastColumn();
    if (lastCol < 1) return;
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

    const blobs = [];
    let streak = 0;
    // Sisir dari KANAN ke KIRI agar koordinat kolom kiri stabil.
    for (let c = lastCol; c >= 1; c--) {
      const h = String(headers[c - 1] || '').trim();
      if (h === '') {
        if (streak) { blobs.push({ start: c + 1, count: streak }); streak = 0; }
        plan.untitled.push(nm + ' → kolom ' + c + ' (header kosong) dilewati');
        continue;
      }
      if (keep.indexOf(_normalize(h)) === -1) {
        streak++;
      } else {
        if (streak) { blobs.push({ start: c + 1, count: streak }); streak = 0; }
      }
    }
    if (streak) blobs.push({ start: 1, count: streak });
    if (blobs.length) plan.cols.push({ sheet: nm, blobs: blobs });
  });

  // 4) Sheet yang terdaftar tapi tidak ada di Spreadsheet
  Object.keys(columnKeys).forEach(function (key) {
    if (!ss.getSheetByName(columnKeys[key])) {
      plan.missing.push(columnKeys[key]);
    }
  });

  return plan;
}

// ── PREVIEW: LAPORAN DULU, TANPA MENGHAPUS ───────────────────
function previewCleanup() {
  const plan = _collectCleanupPlan();
  Logger.log('════════ PREVIEW CLEANUP ════════');

  if (!plan.cols.length) Logger.log('Tidak ada kolom untuk dihapus.');
  plan.cols.forEach(function (item) {
    Logger.log('Sheet "' + item.sheet + '" — akan hapus kolom:');
    item.blobs.sort(function (a, b) { return b.start - a.start; }).forEach(function (b) {
      Logger.log('  • kolom ' + b.start + (b.count > 1 ? '–' + (b.start + b.count - 1) : '') + ' (total ' + b.count + ')');
    });
  });

  if (!plan.drops.length) Logger.log('Tidak ada sheet untuk dihapus.');
  plan.drops.forEach(function (nm) {
    Logger.log('HAPUS SHEET TOTAL: "' + nm + '" — DATA IKUT HILANG');
  });

  plan.untitled.forEach(function (m) { Logger.log('SKIP (data tak berlabel): ' + m); });
  plan.missing.forEach(function (m) { Logger.log('Sheet terdaftar tapi tidak ada: ' + m); });

  Logger.log('RINGKASAN: kolom=' + plan.cols.reduce(function (s, x) {
    return s + x.blobs.reduce(function (t, b) { return t + b.count; }, 0);
  }, 0) + ' | sheet=' + plan.drops.length);
}

// ── EKSEKUSI NEGARA ──────────────────────────────────────────
function executeCleanup() {
  const plan = _collectCleanupPlan();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let removedCols = 0;

  // 1) Hapus kolom — PASTIKAN duluan (data dari sheet ini masih ada) …
  plan.cols.forEach(function (item) {
    const sh = ss.getSheetByName(item.sheet);
    if (!sh) return;
    // delete dari kanan → kiri agar index kolom kiri tetap valid.
    item.blobs.sort(function (a, b) { return b.start - a.start; }).forEach(function (b) {
      sh.deleteColumns(b.start, b.count);
      removedCols += b.count;
    });
  });

  // 2) Hapus sheet total — TERAKHIR, dan hanya jika >1 sheet tersisa.
  let removedSheets = 0;
  plan.drops.forEach(function (name) {
    if (ss.getSheets().length <= 1) return;
    const sh = ss.getSheetByName(name);
    if (sh) { ss.deleteSheet(sh); removedSheets++; }
  });

  Logger.log('[CLEANUP] Selesai. Kolom dihapus: ' + removedCols +
    ' | Sheet dihapus: ' + removedSheets +
    ' | Sheet: ' + plan.drops.join(', '));
  return { success: true, columnsRemoved: removedCols, sheetsRemoved: removedSheets };
}

// ── BACKUP OPSIONAL (butuh scope DriveApp) ───────────────────
function backupSpreadsheetForCleanup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = ss.getName() + ' [BACKUP ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm') + ']';
  const copy = DriveApp.getFileById(ss.getId()).makeCopy(name);
  Logger.log('Backup dibuat: ' + copy.getUrl());
  return copy.getUrl();
}

/* ═══════════════════════════════════════════════════════════════
   EDIT PENYERTA DI code.gs — WAJIB setelah executeCleanup()
   (agar kolom penulis TIDAK membuat ulang kolom yang dibuang,
    dan guard/index tidak salah).

   1) initializeSheets()  — hapus dari array header:
      + Flights:     "id", "uid", "isArchived",
                     "invoicePdfUrl","invoicePdfId",
                     "kwitansiPdfUrl","kwitansiPdfId"
      + Master_Signatory:  "qrcodeUrl", "qrcodeText"
      + Master_BankAccount:"swiftCode"
      + Master_AirportHours:"roundingMethod"
      + Audit_Log:   "fieldName","oldValue","ipAddress","userAgent"
      + Doc_ShareTokens:   "createdAt","createdBy"
      + Doc_Batch:   "createdAt","createdBy"
      (Jika DROP_SHEETS berisi Invoice_Settings → hapus blok
       createSheetIfNeeded(Invoice_Settings) dari initializeSheets.)

   2) saveFlight() — hapus baris:
         if (k === 'id') return data.id || 'FLT-' + Date.now();

   3) updateFlight() IMMUTABLE_AFTER_INVOICE — hapus 4 entri:
         'invoicePdfUrl','invoicePdfId','kwitansiPdfUrl','kwitansiPdfId'

   4) updateFlightData() — hapus blok isArchiveOnly / 'ARCHIVE'
      (kolom isArchived sudah tidak ada):

   5) logAudit() appendRow 10 nilai → 6 nilai:
         sheet.appendRow([new Date(), user, action, tbl || "",
           rid ? String(rid) : "",
           newValue ? String(newValue).substring(0,500) : ""]);

   6) generateDocShareToken() appendRow 6 nilai → 4 nilai:
         s.appendRow([shareToken, rowId, expiresAt, false]);

   7) getSignatory() — hapus fallback qrcodeUrl (tahap 3):
         if (!sign) { sign = s.find(x => (x.qrcodeBase64 …) || …); }

   8) getMasterSchemas() Master_AirportHours — hapus entri
      roundingMethod (field FLOOR/ROUND tak lagi ada).

   9) FRONTEND MasterPage.jsx — hapus field form:
      + "swiftCode"      (Bank Account)
      + "roundingMethod" (Jam Operasional)
      (prAT keep qrcodeUrl/qrcodeText di SKIP_COLUMNS biar aman.)

   TANPA edit #5 & #6, appendRow akan MENCIPTAKAN ulang kolom
   yang dibuang di baris baru. Prioritas tertinggi.
   ═══════════════════════════════════════════════════════════════ */