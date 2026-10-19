/* util.js: tiny shared helpers. Everything hangs off window.PIP. */
(function () {
  'use strict';
  var PIP = (window.PIP = window.PIP || {});

  // localStorage that never throws (private mode, blocked storage, etc.)
  var store = {
    get: function (key, fallback) {
      try {
        var v = window.localStorage.getItem('pip:' + key);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem('pip:' + key, String(value)); } catch (e) { /* ignore */ }
    }
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var mm = function (q) {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia(q)
      : { matches: false, addEventListener: function () {} };
  };
  var reduceMotion = mm('(prefers-reduced-motion: reduce)');
  var coarse = mm('(pointer: coarse)');

  // one polite message at a time
  var toastTimer = 0;
  function toast(msg, ms) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-show'); }, ms || 3200);
  }

  // Calls cb(isVisible) whenever el enters or leaves the viewport.
  function watchVisible(el, cb, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      cb(entries[entries.length - 1].isIntersecting);
    }, { rootMargin: margin || '80px' });
    io.observe(el);
  }

  // Optional official assets. Off by default so the page never requests a file that
  // might not exist (a 404 would show up as a console error). Turn on with
  // <meta name="pip-assets" content="on"> after adding the PNGs to /assets.
  function optionalImages() {
    var meta = document.querySelector('meta[name="pip-assets"]');
    if (!meta || meta.getAttribute('content') !== 'on') return;
    $$('img[data-optional]').forEach(function (img) {
      var thumb = img.closest('.thumb');
      img.addEventListener('load', function () { if (thumb) thumb.hidden = false; });
      img.addEventListener('error', function () { if (thumb) thumb.hidden = true; });
      img.src = img.getAttribute('data-src');
    });
  }

  PIP.store = store;
  PIP.$ = $;
  PIP.$$ = $$;
  PIP.clamp = clamp;
  PIP.reduceMotion = reduceMotion;
  PIP.coarse = coarse;
  PIP.toast = toast;
  PIP.watchVisible = watchVisible;
  PIP.optionalImages = optionalImages;
})();
