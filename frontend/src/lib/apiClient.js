// ============================================================
// API CLIENT — memanggil Apps Script Web App melalui fetch
// Menangani auth (username + token), JSON body, dan error.
// ============================================================
import { APPSCRIPT_URL } from '../config';

// Helper: gabungkan GET params tanpa mematahkan URL
function buildUrl(action, params = {}) {
  const url = new URL(APPSCRIPT_URL, typeof window !== 'undefined' ? window.location.origin : undefined);
  // Untuk dev proxy, pastikan path tetap
  const sep = url.pathname.endsWith('/exec') || url.pathname.endsWith('/api') ? (url.search ? '&' : '?') : (url.search ? '&' : '?');
  const query = new URLSearchParams({ action, ...params });
  return `${url.pathname}${sep}${query.toString()}`;
}

async function request(action, { method = 'POST', params = {}, body = {}, auth = null } = {}) {
  const username = auth?.username || localStorage.getItem('airnav_username') || '';
  const token = auth?.token || localStorage.getItem('airnav_token') || '';

  // PENTING: JANGAN kirim Content-Type: application/json.
  // Header itu memaksa browser mengirim preflight OPTIONS. Apps Script
  // ContentService TIDAK menjawab preflight → CORS error "Failed to fetch".
  // text/plain = "simple request" → tanpa preflight → CORS diizinkan.
  // Apps Script membaca e.postData.contents tanpa peduli Content-Type.
  const headers = method === 'GET' ? {} : { 'Content-Type': 'text/plain;charset=UTF-8' };

  let url = APPSCRIPT_URL;
  const sep = url.includes('?') ? '&' : '?';
  url = `${url}${sep}action=${encodeURIComponent(action)}`;
  if (method === 'GET') {
    const p = new URLSearchParams(params);
    if (p.toString()) url += `&${p.toString()}`;
    if (username) url += `&username=${encodeURIComponent(username)}`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
  } else {
    const payload = { action, ...body };
    if (username) payload.username = username;
    if (token) payload.token = token;
    body = payload;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(body),
      // Apps Script butuh redirect manual
      redirect: 'follow',
    });

    const data = await res.json().catch(async () => {
      const text = await res.text();
      throw new Error(text.slice(0, 200));
    });

    if (!data || data.success === false) {
      const error = new Error(data?.error || 'Permintaan gagal');
      error.api = data;
      throw error;
    }

    return data;
  } catch (err) {
    // JAngan bungkus error API dua kali
    if (err.api) throw err;
    throw new Error('Network error: ' + err.message);
  }
}

// ── AUTH ──
export const api = {
  async login(username, password) {
    const d = await request('login', {
      body: { username, password },
      auth: null,
    });
    return d;
  },

  async forceLogin(username, password) {
    const d = await request('forceLogin', { body: { username, password } });
    return d;
  },

  async logout() {
    const d = await request('logout', {});
    localStorage.removeItem('airnav_username');
    localStorage.removeItem('airnav_token');
    return d;
  },

  async checkSession() {
    return request('checkSession', { method: 'GET' });
  },

  async changePassword(oldPassword, newPassword, confirmPassword) {
    return request('changePassword', {
      body: { oldPassword, newPassword, confirmPassword },
    });
  },

  async forcePasswordChange(username) {
    return request('forcePasswordChange', { method: 'GET', auth: { username } });
  },

  // ── BOOTSTRAP ──
  async bootstrap(clientVersion, unitCode) {
    return request('bootstrap', {
      method: 'GET',
      params: { clientVersion: clientVersion || '', unitCode: unitCode || '' },
    });
  },

  async dashboard() {
    return request('dashboard', { method: 'GET' });
  },

  async unitData(unitCode) {
    return request('unitData', { method: 'GET', params: { unitCode } });
  },

  // ── MASTER DATA ──
  async masterList(sheet) {
    return request('masterList', { method: 'GET', params: { sheet } });
  },

  async config() {
    return request('config', { method: 'GET' });
  },

  async schemas() {
    return request('schemas', { method: 'GET' });
  },

  async signatory(unitCode) {
    return request('signatory', { method: 'GET', params: { unitCode } });
  },

  async bankAccounts(unitCode) {
    return request('bankAccounts', { method: 'GET', params: { unitCode } });
  },

  async invoiceSettings() {
    return request('invoiceSettings', { method: 'GET' });
  },

  async saveMasterItem(sheet, data, rid = null) {
    return request('saveMasterItem', { body: { sheet, data, rid } });
  },

  async deleteMasterItem(sheet, rid) {
    return request('deleteMasterItem', { body: { sheet, rid } });
  },

  // ── FLIGHT ──
  async flight(rid) {
    return request('flight', { method: 'GET', params: { rid } });
  },

  async flightsByRowIds(rowIds) {
    return request('flightsByRowIds', { method: 'GET', params: { rowIds: rowIds.join(',') } });
  },

  async saveFlight(data) {
    return request('saveFlight', { body: { data } });
  },

  async updateFlight(rid, updates) {
    return request('updateFlight', { body: { rid, updates } });
  },

  async deleteFlight(rid) {
    return request('deleteFlight', { body: { rid } });
  },

  async updateStatus(rid, newStatus) {
    return request('updateStatus', { body: { rid, newStatus } });
  },

  async validateFlight(rid, manualKurs, usePpn, usePph) {
    return request('validateFlight', {
      body: { rid, manualKurs, usePpn, usePph },
    });
  },

  async voidInvoice(rid, reason) {
    return request('voidInvoice', { body: { rid, reason } });
  },

  async topFieldHistory(unitCode, fieldName) {
    return request('topFieldHistory', { method: 'GET', params: { unitCode, fieldName } });
  },

  async exchangeRate(currency, flightDate) {
    return request('exchangeRate', { method: 'GET', params: { currency, flightDate } });
  },

  async saveExchangeRate(currency, rate, flightDate) {
    return request('saveExchangeRate', { body: { currency, rate, flightDate } });
  },

  // ── BATCH ──
  async generateBatch(rowIds) {
    return request('generateBatch', { body: { rowIds } });
  },

  async batchData(batchId, token) {
    return request('batchData', { method: 'GET', params: { batchId, token } });
  },

  async publicBatchData(batchId, token) {
    return request('publicBatchData', { method: 'GET', params: { batchId, token } });
  },

  async verifyBatch(batchId) {
    return request('verifyBatch', { body: { batchId } });
  },

  async rejectBatch(batchId, reasonObj) {
    return request('rejectBatch', { body: { batchId, reasonObj } });
  },

  async submitBatchProof(batchId, token, fileBase64, fileName, mimeType, note) {
    return request('submitBatchProof', {
      body: { batchId, token, fileBase64, fileName, mimeType, note },
    });
  },

  async batchLinks(rowIds) {
    return request('batchLinks', { method: 'GET', params: { rowIds: rowIds.join(',') } });
  },

  async batchesByIds(batchIds) {
    return request('batchesByIds', { method: 'GET', params: { batchIds: batchIds.join(',') } });
  },

  async publicDocData(rid, t) {
    return request('publicDocData', { method: 'GET', params: { rid, t } });
  },
};

export default api;