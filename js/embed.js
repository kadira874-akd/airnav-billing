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
    var loading = document.getElementById('loading');

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

    var loaded = false;

    frame.addEventListener('load', function () {
      loaded = true;
      if (loading) loading.style.display = 'none';
    });

    // Timeout: jika iframe tidak selesai load dalam 20 detik,
    // tampilkan pesan error di layar (mengganti loading).
    setTimeout(function () {
      if (loaded) return;
      if (!loading) return;
      loading.style.display = 'flex';
      loading.innerHTML =
        '<div style="color:#f43f5e;text-align:center;padding:2rem;max-width:420px">' +
          '<div style="font-size:1.5rem;margin-bottom:1rem">&#9888;</div>' +
          '<div style="font-size:1rem;font-weight:700;margin-bottom:.75rem">Tidak Dapat Memuat Tagihan</div>' +
          '<div style="font-size:.8rem;color:#94a3b8;line-height:1.6;text-align:left">' +
            'Server aplikasi tidak merespons. Kemungkinan penyebab:<br><br>' +
            '&#8226; Web App Apps Script belum di-deploy ke versi terbaru<br>' +
            '&#8226; URL endpoint tidak sesuai<br>' +
            '&#8226; Izin akses web app belum "Anyone"<br><br>' +
            'Hubungi admin AirNav untuk bantuan.' +
          '</div>' +
        '</div>';
    }, 20000);

    stage.appendChild(frame);
    root.appendChild(stage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
