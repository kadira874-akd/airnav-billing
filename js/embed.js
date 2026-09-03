/* ============================================================
 * embed.js — Memuat Web App Apps Script di dalam iframe (domain Vercel)
 * dan MENYEMBUNYIKAN banner Google dengan menggeser iframe ke atas
 * (overscan + transform), sehingga URL tetap ringkas & bersih.
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

    // Sembunyikan loading
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Bersihkan root
    root.innerHTML = '';

    // Karena Web App Apps Script di-iframe dari domain Vercel (bukan
    // script.google.com) dengan setXFrameOptionsMode(ALLOWALL), Google
    // TIDAK menampilkan banner → iframe tampil UTUH penuh, tanpa memotong.
    var stage = document.createElement('div');
    stage.id = 'stage';
    stage.style.cssText = 'position:absolute;inset:0;';

    var frame = document.createElement('iframe');
    frame.id = 'appFrame';
    frame.setAttribute('src', src);
    frame.setAttribute('allow', 'clipboard-write');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;' +
      'margin:0;padding:0;border:none;display:block;' +
      '-webkit-overflow-scrolling:touch;';

    frame.onload = function () {
      if (document.getElementById('loading')) document.getElementById('loading').style.display = 'none';
    };

    // Timeout: jika iframe gagal load dalam 15 detik, tampilkan pesan error
    var loadTimeout = setTimeout(function () {
      var loading = document.getElementById('loading');
      if (loading && loading.style.display !== 'none') {
        loading.innerHTML =
          '<div style="color:#f43f5e;text-align:center;padding:2rem;max-width:400px">' +
            '<div style="font-size:1.5rem;margin-bottom:1rem">&#9888;</div>' +
            '<div style="font-size:1rem;font-weight:700;margin-bottom:.5rem">Gagal Memuat Aplikasi</div>' +
            '<div style="font-size:.82rem;color:#94a3b8;line-height:1.5">' +
              'Web App Apps Script tidak merespons dalam 15 detik.<br><br>' +
              'Kemungkinan:<br>' +
              '1. Web App belum di-deploy<br>' +
              '2. URL endpoint salah<br>' +
              '3. Web App sedang down' +
            '</div>' +
          '</div>';
      }
    }, 15000);

    // Batalkan timeout jika iframe berhasil load
    frame.addEventListener('load', function () {
      clearTimeout(loadTimeout);
    });

    // Handle iframe load error
    frame.addEventListener('error', function () {
      clearTimeout(loadTimeout);
      var loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML =
          '<div style="color:#f43f5e;text-align:center;padding:2rem;max-width:400px">' +
            '<div style="font-size:1.5rem;margin-bottom:1rem">&#9888;</div>' +
            '<div style="font-size:1rem;font-weight:700;margin-bottom:.5rem">Gagal Memuat Halaman</div>' +
            '<div style="font-size:.82rem;color:#94a3b8;line-height:1.5">' +
              'Tidak dapat terhubung ke server aplikasi.<br>' +
              'Periksa koneksi internet dan coba muat ulang.' +
            '</div>' +
          '</div>';
      }
    });

    stage.appendChild(frame);
    root.appendChild(stage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
