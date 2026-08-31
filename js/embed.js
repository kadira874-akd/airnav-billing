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

  function getOffset() {
    // Allow override via CSS var / senilai BANNER_HIDE_PX
    var v = parseInt(CONFIG.BANNER_HIDE_PX, 10);
    return isNaN(v) ? 0 : v;
  }

  function mount() {
    var root = document.getElementById('wrap');
    if (!root) return;

    var offset = getOffset();
    var src = buildSrc();

    // Sembunyikan loading
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Bersihkan root
    root.innerHTML = '';

    // Container klip (overflow hidden) — "panggung" aplikasi tanpa banner
    var stage = document.createElement('div');
    stage.id = 'stage';
    stage.style.cssText =
      'position:absolute;inset:0;overflow:hidden;';

    // Iframe diperbesar setinggi stage + offset, lalu digeser ke atas
    // sebesar offset agar banner keluar dari area tampil.
    var frame = document.createElement('iframe');
    frame.id = 'appFrame';
    frame.setAttribute('src', src);
    frame.setAttribute('allow', 'clipboard-write');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.style.cssText =
      'position:absolute;left:0;top:-' + offset + 'px;' +
      'width:100%;height:' + (100 + (offset / (window.innerHeight || 800)) * 100) + '%;' +
      'margin:0;padding:0;border:none;display:block;' +
      'transform:translateY(0);' +
      '-webkit-overflow-scrolling:touch;';

    // Fallback tepat jika global window berubah — hitung ulang tinggi px
    function resize() {
      var h = window.innerHeight + offset;
      frame.style.top = '-' + offset + 'px';
      frame.style.height = h + 'px';
    }
    frame.onload = function () {
      if (document.getElementById('loading')) document.getElementById('loading').style.display = 'none';
    };
    window.addEventListener('resize', resize);

    stage.appendChild(frame);
    root.appendChild(stage);
    resize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
