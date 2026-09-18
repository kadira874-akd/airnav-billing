/* ============================================================
 * KONFIGURASI SENTRAL — SESUAIKAN DI SINI
 * ============================================================
 * Satu-satunya file yang perlu diedit saat URL Apps Script berubah.
 */
window.AIRNAV_CONFIG = {
  // Verbatim URL Web App Apps Script (endpoint /exec). Jangan ubah format.
  APPSCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw1r71lZLHn8SiB8va2bx_Lw7QA-qxZVNV-q6JzhXhW-Y_hPmG7pcmLL3A6a34giRXc3A/exec',

  // Separator untuk params (exec memakai '?' di akhir URL)
  APPSCRIPT_QUERY: '?',

  /*
   * Iframe dipasang penuh (top:0) — panel header menempel pada frame.
   */

  // Label situs / nama aplikasi (dipakai judul & fallback loading)
  APP_NAME: 'AirNav Billing',

  // Warna tema (ringkas)
  THEME_BG: '#05101e'
};
