/* ═══════════════════════════════════════════════════════════════
   API.gs — JSON REST Bridge untuk AirNav Billing
   ═══════════════════════════════════════════════════════════════

   CARA PASANG:
   1. Tambah file ini ke project Apps Script Anda (code.gs yang sudah live).
   2. HAPUS fungsi doGet() & buildPublicDownloadPageHTML() dari code.gs.
   3. File lain (Flights.gs, Auth.gs, dll) TIDAK DIUBAH.
   4. Deploy ulang Web App → Execute as: Me, Access: Anyone.
   5. Semua request ke /exec sekarang melewati router JSON ini.

   ARSITEKTUR:
   - GET  /exec?action=xxx       → dispatch GET handlers
   - POST /exec (JSON body)      → dispatch POST handlers
   - Legacy HTML routes tetap jalan untuk batch/doc portal
   ═══════════════════════════════════════════════════════════════ */

// ── HEADER JSON HELPER ────────────────────────────────────────
function _json(data, statusCode) {
  const output = ContentService.createTextOutput(
    JSON.stringify(_deepSanitizeForClient(data))
  );
  output.setMimeType(MimeType.JSON);
  return output;
}

function _cors() {
  // Apps Script otomatis set CORS headers untuk "Anyone" deployment
  // Tidak perlu manual, tapi doOptions untuk preflight
  return ContentService.createTextOutput('');
}

// ── CORS PREFLIGHT ────────────────────────────────────────────
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(MimeType.TEXT);
}

// ── AUTH HELPER ───────────────────────────────────────────────
function _extractAuth(e, body) {
  // GET: auth dari query params
  // POST: auth dari body JSON
  const src = (body && typeof body === 'object') ? body : (e.parameter || {});
  return {
    username: src.username || src._username || '',
    token:    src.token    || src._token    || ''
  };
}

// ── GET ROUTER ────────────────────────────────────────────────
function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action;

    // ── Legacy HTML routes (batch portal & doc download) ──
    if (p.batch && p.bid && p.t) {
      return HtmlService.createHtmlOutputFromFile('BatchInvoicePortal')
        .setTitle('Portal Tagihan — AirNav Indonesia')
        .addMetaTag('viewport', 'width=device-width,initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (p.doc && p.rid && p.t) {
      return HtmlService.createHtmlOutputFromFile('PublicDownload')
        .setTitle('Download Dokumen — AirNav Indonesia')
        .addMetaTag('viewport', 'width=device-width,initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // ── JSON API GET ──
    if (!action) {
      return _json({ success: false, error: 'Missing action parameter' });
    }

    const auth = _extractAuth(e, null);

    switch (action) {

      // ── AUTH ──
      case 'checkSession':
        return _json(checkSession(auth.username, auth.token));

      case 'appVersion':
        return _json(getAppVersion());

      case 'forcePasswordChange':
        return _json(checkForcePasswordChange(auth.username));

      // ── BOOTSTRAP ──
      case 'bootstrap':
        return _json(getAppBootstrap(p.clientVersion || '', p.unitCode || '', auth.username, auth.token));

      case 'dashboard':
        return _json(getDashboardData(auth.username, auth.token));

      case 'unitData':
        return _json(getUnitData(p.unitCode || '', auth.username, auth.token));

      // ── MASTER DATA ──
      case 'masterList':
        return _json(getMasterDataList(p.sheet || '', auth.username, auth.token));

      case 'config':
        return _json(getConfigData());

      case 'schemas':
        return _json(getMasterSchemas());

      case 'signatory':
        return _json(getSignatory(p.unitCode || ''));

      case 'bankAccounts':
        return _json(getBankAccounts(p.unitCode || ''));

      case 'invoiceSettings':
        return _json(getInvoiceSettings());

      // ── FLIGHT ──
      case 'flight':
        return _json(getFlightByRowId(parseInt(p.rid, 10)));

      case 'flightsByRowIds':
        return _json(getFlightsByRowIds((p.rowIds || '').split(',').map(Number)));

      case 'topFieldHistory':
        return _json(getTopFieldHistory(p.unitCode, p.fieldName, auth.username, auth.token));

      case 'exchangeRate':
        return _json({ success: true, data: getExchangeRateByDate(p.currency || 'USD', p.flightDate || '') });

      // ── BATCH ──
      case 'batchData':
        return _json(getBatchData(p.batchId || '', p.token || ''));

      case 'publicBatchData':
        return _json(getPublicBatchData(p.batchId || '', p.token || ''));

      case 'publicDocData':
        return _json(getPublicDocData(p.rid || '', p.t || ''));

      case 'batchLinks':
        return _json(getFlightBatchLinks((p.rowIds || '').split(',').map(Number), auth.username, auth.token));

      case 'batchesByIds':
        return _json(getBatchesByIds((p.batchIds || '').split(',').map(Number), auth.username, auth.token));

      default:
        return _json({ success: false, error: 'Unknown GET action: ' + action });
    }

  } catch (err) {
    Logger.log('[API doGet] Error: ' + err.toString());
    return _json({ success: false, error: err.toString() });
  }
}

// ── POST ROUTER ───────────────────────────────────────────────
function doPost(e) {
  try {
    let body = {};
    try { body = JSON.parse(e.postData.contents || '{}'); } catch (parseErr) {
      return _json({ success: false, error: 'Invalid JSON body' });
    }

    const action = body.action || '';
    const auth = _extractAuth(e, body);

    switch (action) {

      // ── AUTH ──
      case 'login':
        return _json(doLoginCheck(body.username || '', body.password || ''));

      case 'forceLogin':
        return _json(forceLoginOverride(body.username || '', body.password || ''));

      case 'logout':
        return _json(doLogout(auth.username, auth.token));

      case 'changePassword':
        return _json(changePassword(
          body.oldPassword || '',
          body.newPassword || '',
          body.confirmPassword || '',
          auth.username,
          auth.token
        ));

      // ── FLIGHT CRUD ──
      case 'saveFlight':
        return _json(saveNewFlight(body.data || {}, auth.username, auth.token));

      case 'updateFlight':
        return _json(updateFlightData(
          parseInt(body.rid, 10),
          body.updates || {},
          auth.username,
          auth.token
        ));

      case 'deleteFlight':
        return _json(deleteFlight(parseInt(body.rid, 10), auth.username, auth.token));

      case 'updateStatus':
        return _json(updateFlightStatusFlow(
          parseInt(body.rid, 10),
          body.newStatus || '',
          auth.username,
          auth.token
        ));

      case 'validateFlight':
        return _json(validateFlightRecord(
          parseInt(body.rid, 10),
          body.manualKurs,
          body.usePpn,
          body.usePph,
          auth.username,
          auth.token
        ));

      case 'voidInvoice':
        return _json(voidInvoiceRecord(
          parseInt(body.rid, 10),
          body.reason || '',
          auth.username,
          auth.token
        ));

      // ── MASTER DATA CRUD ──
      case 'saveMasterItem':
        return _json(saveMasterDataItem(
          body.sheet || '',
          body.data || {},
          body.rid ? parseInt(body.rid, 10) : null,
          auth.username,
          auth.token
        ));

      case 'deleteMasterItem':
        return _json(deleteMasterDataItem(
          body.sheet || '',
          parseInt(body.rid, 10),
          auth.username,
          auth.token
        ));

      case 'saveExchangeRate':
        return _json(saveExchangeRateByDate(
          body.currency || 'USD',
          body.rate,
          body.flightDate || '',
          auth.username,
          auth.token
        ));

      // ── BATCH ──
      case 'generateBatch':
        return _json(generateBatchInvoiceToken(
          body.rowIds || [],
          auth.username,
          auth.token
        ));

      case 'verifyBatch':
        return _json(verifyBatchInvoice(
          parseInt(body.batchId, 10),
          auth.username,
          auth.token
        ));

      case 'rejectBatch':
        return _json(rejectBatchInvoice(
          parseInt(body.batchId, 10),
          body.reasonObj || {},
          auth.username,
          auth.token
        ));

      case 'submitBatchProof':
        return _json(submitBatchProof(
          parseInt(body.batchId, 10),
          body.token || '',
          body.fileBase64 || '',
          body.fileName || '',
          body.mimeType || '',
          body.note || ''
        ));

      default:
        return _json({ success: false, error: 'Unknown POST action: ' + action });
    }

  } catch (err) {
    Logger.log('[API doPost] Error: ' + err.toString());
    return _json({ success: false, error: err.toString() });
  }
}
