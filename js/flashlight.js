/* flashlight.js: Full-page Night Flashlight mode.
   Darkens the entire page and turns the cursor / active element
   into a soft lantern revealing underlying content.
   Off by default, supports full keyboard navigation, touch fallback,
   and respects reduced motion.
*/
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};

  var store = PIP.store || {
    get: function (k, d) { try { return localStorage.getItem('pip_' + k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('pip_' + k, v); } catch (e) {} }
  };

  var state = {
    enabled: false,
    x: 0,
    y: 0,
    radius: 160
  };

  var overlayEl = null;
  var glowEl = null;
  var btnEl = null;

  function setPosition(x, y) {
    state.x = x;
    state.y = y;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--fl-x', x + 'px');
      document.documentElement.style.setProperty('--fl-y', y + 'px');
    }
  }

  function setRadius(r) {
    state.radius = r;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--fl-r', r + 'px');
    }
  }

  function updateAria() {
    if (!btnEl) return;
    var on = state.enabled;
    btnEl.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnEl.setAttribute('aria-label', on ? 'Night flashlight on, turn it off' : 'Night flashlight off, turn it on');
    btnEl.classList.toggle('is-active', on);
    var label = btnEl.querySelector('#flashlightLabel');
    if (label) {
      label.textContent = on ? 'Lantern On' : 'Lantern';
    }
  }

  function setEnabled(val) {
    state.enabled = Boolean(val);
    store.set('flashlight', state.enabled ? 'on' : 'off');

    if (typeof document !== 'undefined' && document.documentElement) {
      if (state.enabled) {
        document.documentElement.setAttribute('data-flashlight', 'on');
      } else {
        document.documentElement.removeAttribute('data-flashlight');
      }
    }

    if (overlayEl) {
      overlayEl.hidden = !state.enabled;
    }
    if (glowEl) {
      glowEl.hidden = !state.enabled;
    }

    updateAria();

    if (state.enabled && PIP.audio && typeof PIP.audio.note === 'function' && PIP.audio.isOn()) {
      PIP.audio.note(440, { dur: 0.15, gain: 0.08 });
    }
  }

  function toggle() {
    setEnabled(!state.enabled);
    return state.enabled;
  }

  function init(options) {
    options = options || {};
    overlayEl = options.overlay || (typeof document !== 'undefined' ? document.getElementById('flashlightOverlay') : null);
    glowEl = options.glow || (typeof document !== 'undefined' ? document.getElementById('flashlightGlow') : null);
    btnEl = options.button || (typeof document !== 'undefined' ? document.getElementById('flashlightBtn') : null);

    // Default center in case cursor hasn't moved yet
    var initialX = (typeof window !== 'undefined' && window.innerWidth) ? (window.innerWidth / 2) : 300;
    var initialY = (typeof window !== 'undefined' && window.innerHeight) ? (window.innerHeight / 2) : 300;
    setPosition(initialX, initialY);
    setRadius(160);

    // Off by default
    var saved = store.get('flashlight', 'off');
    setEnabled(saved === 'on');

    if (btnEl) {
      btnEl.addEventListener('click', function () {
        toggle();
      });
    }

    if (typeof window !== 'undefined') {
      // Mouse / pointer tracking
      window.addEventListener('pointermove', function (e) {
        if (!state.enabled) return;
        setPosition(e.clientX, e.clientY);
      }, { passive: true });

      // Touch fallback tracking
      window.addEventListener('touchmove', function (e) {
        if (!state.enabled || !e.touches || !e.touches[0]) return;
        setPosition(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      window.addEventListener('touchstart', function (e) {
        if (!state.enabled || !e.touches || !e.touches[0]) return;
        setPosition(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      // Keyboard navigation support: lantern tracks active element focus!
      if (typeof document !== 'undefined') {
        document.addEventListener('focusin', function (e) {
          if (!state.enabled || !e.target || typeof e.target.getBoundingClientRect !== 'function') return;
          var r = e.target.getBoundingClientRect();
          setPosition(r.left + r.width / 2, r.top + r.height / 2);
        });
      }
    }
  }

  var Flashlight = {
    init: init,
    toggle: toggle,
    setEnabled: setEnabled,
    isEnabled: function () { return state.enabled; },
    setPosition: setPosition,
    setRadius: setRadius,
    getState: function () { return { enabled: state.enabled, x: state.x, y: state.y, radius: state.radius }; }
  };

  PIP.flashlight = Flashlight;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Flashlight;
  }
})();
