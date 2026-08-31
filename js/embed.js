(function () {
  'use strict';

  var CONFIG = window.AIRNAV_CONFIG || {};

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
    var q = spec.buildQuery || paramsFromUrl;
    var query = '';
    if (typeof q === 'function') query = q(paramsFromUrl());
    else if (typeof q === 'string') query = q;
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + (query ? sep + query.replace(/^[?&]/, '') : '');
  }

  function mount() {
    var root = document.getElementById('wrap');
    if (!root) return;
    var src = buildSrc();
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    root.innerHTML = '';

    var stage = document.createElement('div');
    stage.style.cssText = 'position:absolute;inset:0;';

    var frame = document.createElement('iframe');
    frame.id = 'appFrame';
    frame.setAttribute('src', src);
    frame.setAttribute('allow', 'clipboard-write');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;' +
      'margin:0;padding:0;border:none;display:block;';

    frame.onload = function () {
      var ld = document.getElementById('loading');
      if (ld) ld.style.display = 'none';
    };

    stage.appendChild(frame);
    root.appendChild(stage);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
