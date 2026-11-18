/* dressup.js: Dress-up Pip nightcap & accessories customizer.
   Allows visitors to recolor Pip's nightcap (.p-cap), bow (.p-bow), and stars (.p-capstar),
   persisting the chosen look in PIP.store so it persists across reloads.
*/
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};

  var store = PIP.store || {
    get: function (k, d) { try { return localStorage.getItem('pip_' + k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('pip_' + k, v); } catch (e) {} }
  };

  var PALETTES = {
    classic: {
      id: 'classic',
      name: 'Classic Lavender',
      cap: '#8b8fd9',
      bow: '#ff7fa8',
      star: '#fff1da',
      description: 'Original lavender nightcap with sweet pink bow and cream stars'
    },
    minty: {
      id: 'minty',
      name: 'Mint Meadow',
      cap: '#48bfe3',
      bow: '#ff9f76',
      star: '#fbf8cc',
      description: 'Crisp mint cyan nightcap with soft coral bow and yellow stars'
    },
    twilight: {
      id: 'twilight',
      name: 'Twilight Dusk',
      cap: '#5a4897',
      bow: '#f4a261',
      star: '#eae4e9',
      description: 'Deep dusk violet nightcap with golden amber bow'
    },
    cotton: {
      id: 'cotton',
      name: 'Cotton Candy',
      cap: '#f78fb3',
      bow: '#63cdda',
      star: '#ffffff',
      description: 'Pastel candy pink nightcap with sky blue bow and sugar stars'
    },
    starlight: {
      id: 'starlight',
      name: 'Cosmic Starlight',
      cap: '#7048e8',
      bow: '#20c997',
      star: '#ffd166',
      description: 'Vivid cosmic purple nightcap with neon teal bow and gold stars'
    },
    autumn: {
      id: 'autumn',
      name: 'Autumn Ember',
      cap: '#e76f51',
      bow: '#84a98c',
      star: '#ffe8d6',
      description: 'Warm terracotta nightcap with sage green bow and ember stars'
    }
  };

  var currentPalette = 'classic';

  function applyPalette(id, notify) {
    if (!PALETTES[id]) id = 'classic';
    currentPalette = id;
    store.set('pip_palette', id);

    var pal = PALETTES[id];
    var doc = typeof document !== 'undefined' ? document : null;
    if (doc) {
      if (doc.documentElement) {
        doc.documentElement.style.setProperty('--pip-cap', pal.cap);
        doc.documentElement.style.setProperty('--pip-bow', pal.bow);
        doc.documentElement.style.setProperty('--pip-capstar', pal.star);
        doc.documentElement.setAttribute('data-pip-palette', id);
      }

      // Also set SVG fills directly for SVG elements to ensure compatibility
      var capEls = doc.querySelectorAll('.pip-svg .p-cap');
      for (var c = 0; c < capEls.length; c++) {
        capEls[c].style.fill = pal.cap;
      }

      var bowEls = doc.querySelectorAll('.pip-svg .p-bow path, .pip-svg .p-bow circle');
      for (var b = 0; b < bowEls.length; b++) {
        bowEls[b].style.fill = pal.bow;
      }

      var starEls = doc.querySelectorAll('.pip-svg .p-capstar');
      for (var s = 0; s < starEls.length; s++) {
        starEls[s].style.fill = pal.star;
      }

      // Update button aria states
      var btns = doc.querySelectorAll('.dressup-opt');
      for (var i = 0; i < btns.length; i++) {
        var isCurrent = btns[i].getAttribute('data-palette') === id;
        btns[i].setAttribute('aria-checked', isCurrent ? 'true' : 'false');
        btns[i].classList.toggle('is-selected', isCurrent);
      }

      if (notify && PIP.toast) {
        PIP.toast('Pip is now wearing: ' + pal.name + '!');
      }

      if (notify && PIP.audio && typeof PIP.audio.note === 'function' && PIP.audio.isOn()) {
        PIP.audio.note(523.25, { dur: 0.2, gain: 0.1 });
        PIP.audio.note(659.25, { dur: 0.25, gain: 0.1, when: 0.12 });
      }
    }

    return pal;
  }

  function init() {
    var doc = typeof document !== 'undefined' ? document : null;
    if (!doc) return;

    var saved = store.get('pip_palette', 'classic');
    applyPalette(saved, false);

    var toggleBtn = doc.getElementById('dressupBtn');
    var picker = doc.getElementById('dressupPicker');

    if (toggleBtn && picker) {
      toggleBtn.addEventListener('click', function () {
        var isHidden = picker.hidden;
        picker.hidden = !isHidden;
        toggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        if (isHidden) {
          var firstOpt = picker.querySelector('.dressup-opt');
          if (firstOpt) firstOpt.focus();
        }
      });
    }

    var options = doc.querySelectorAll('.dressup-opt');
    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener('click', function () {
        var palId = this.getAttribute('data-palette');
        applyPalette(palId, true);
      });
    }
  }

  var Dressup = {
    init: init,
    applyPalette: applyPalette,
    setPalette: applyPalette,
    getPalette: function () { return currentPalette; },
    getPalettes: function () { return PALETTES; }
  };

  PIP.dressup = Dressup;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dressup;
  }
})();
