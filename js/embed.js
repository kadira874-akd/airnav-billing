/* ============================================================
 * embed.js — Memuat Web App Apps Script di dalam iframe (domain Vercel).
 *
 * GAS menyisipkan strip abu-abu kosong (`#warning.warning-bar`) di atas
 * konten web app (baris pertama tabel wrapper Google). Iframe digeser naik
 * setinggi strip itu dan dipertinggi sama besar, sehingga strip keluar dari
 * area tampil dan panel header langsung menempel pada frame tanpa celah.
 * Atur GAS_PANEL_PX = 0 untuk menonaktifkan penggeseran.
 *
 * Cara pakai (semua halaman):
 *   <script src="js/config.js"></script>
 *   <script>
 *     var spec = {
 *       buildQuery: function(params){ return ''; }, // string kueri utk exec
 *       title: 'AirNav Billing'
 *     };
 *   </script>
 *   <script src="js/embed.js"></script>
 * ============================================================ */

(function () {
  'use strict';

  var CONFIG = window.AIRNAV_CONFIG || {};

  // Pecah URL kueri saat ini (mis. ?bid=..&t=..) — param dari rute Vercel
  function paramsFromUrl() {
    var out = {};
    var search = window.location.search.replace(/^\?/, '');
    if (!search) return out;
    search.split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) try { out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } catch (e) { out[p[0]] = p[1] || ''; }
    });
    return out;
  }

  function buildSrc() {
    var base = CONFIG.APPSCRIPT_URL || '';
    var spec = window.__EMBED_SPEC__ || {};
    var q = (spec.buildQuery || paramsFromUrl); // allow fn(params)
    var query = '';
    if (typeof q === 'function') {
      query = q(paramsFromUrl());
    } else if (typeof q === 'string') {
      query = q;
    }
    // pastikan satu '?' saja
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + (query ? sep + query.replace(/^[?&]/, '') : '');
  }

  function mount() {
    var root = document.getElementById('wrap');
    if (!root) return;

    var src = buildSrc();
    var loading = document.getElementById('loading');

    root.innerHTML = ''; // Bersihkan

    var frame = document.createElement('iframe');
    frame.id = 'appFrame';
    frame.setAttribute('src', src);
    frame.setAttribute('allow', 'clipboard-write');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    
    // PENGATURAN CSS PALING MURNI (Tanpa margin/offset)
    frame.style.cssText = 
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'border:none;display:block;';

    // Event listener tetap ada untuk menangani loading
    frame.addEventListener('load', function () {
      if (loading) loading.style.display = 'none';
    });

    root.appendChild(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
