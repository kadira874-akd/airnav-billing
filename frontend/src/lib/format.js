// ============================================================
// FORMATTER UTILITIES
// ============================================================

const nfIDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nfNumber = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function fmtRupiah(v) {
  const n = parseFloat(v) || 0;
  return nfIDR.format(n);
}

export function fmtNumber(v) {
  const n = parseFloat(v) || 0;
  return nfNumber.format(n);
}

export function fmtDate(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export function fmtDateShort(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear();
}

export function fmtTime(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return String(v.getHours()).padStart(2, '0') + ':' +
      String(v.getMinutes()).padStart(2, '0');
  }
  const m = String(v).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : String(v);
}

export function fmtDateTime(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return fmtDateShort(d) + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

export function statusLabel(s) {
  const map = {
    VALIDATION: 'Validasi',
    INVOICED: 'Invoiced',
    UNPAID: 'Belum Bayar',
    PAID: 'Lunas',
    VOID: 'Void',
  };
  return map[s] || s || '';
}

export function batchStatusLabel(s) {
  const map = {
    ACTIVE: 'Aktif',
    SENT: 'Terkirim',
    PROOF_SUBMITTED: 'Bukti Dikirim',
    VERIFIED: 'Terverifikasi',
    REJECTED: 'Ditolak',
    REJECTED_FINAL: 'Ditolak Final',
  };
  return map[s] || s || '';
}

export function percentage(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function truncate(str, len = 40) {
  if (!str) return '';
  return String(str).length > len ? String(str).slice(0, len) + '…' : str;
}