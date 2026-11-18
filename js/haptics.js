(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};
  var store = PIP.store || {
    get: function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var HAPTIC_PATTERNS = {
    key: [12],
    drop: [22],
    dream: [15, 30, 18],
    default: [15]
  };

  function isSupported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  function isEnabled() {
    return store.get('pip_haptics', 'off') === 'on';
  }

  function setEnabled(val) {
    store.set('pip_haptics', val ? 'on' : 'off');
  }

  function isQuiet() {
    if (typeof document === 'undefined') return false;
    return (document.documentElement && document.documentElement.getAttribute('data-quiet') === 'on') ||
      store.get('quiet', '') === 'on';
  }

  function isReducedMotion() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function canVibrate() {
    if (!isSupported()) return false;
    if (!isEnabled()) return false;
    if (isQuiet()) return false;
    if (isReducedMotion()) return false;
    return true;
  }

  function triggerHaptic(type) {
    if (!canVibrate()) return false;

    var pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.default;
    try {
      return navigator.vibrate(pattern);
    } catch (err) {
      return false;
    }
  }

  function initHaptics() {
    var toggleBtn = document.getElementById('hapticsToggleBtn');
    var statusText = document.getElementById('hapticsStatus');

    function updateUI() {
      var enabled = isEnabled();
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        toggleBtn.classList.toggle('is-on', enabled);
        toggleBtn.textContent = enabled ? 'Toy Haptics: On' : 'Toy Haptics: Off';
      }
      if (statusText) {
        if (!isSupported()) {
          statusText.textContent = 'Haptics not supported on this device';
        } else {
          statusText.textContent = enabled ? 'Haptics active on toys' : 'Haptics off (opt-in)';
        }
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var next = !isEnabled();
        setEnabled(next);
        updateUI();
        if (next) triggerHaptic('key');
      });
    }

    // Attach hooks to toys without modifying core toys.js
    // 1. Music Keys in Lullaby Lab
    var keysEl = document.getElementById('keys');
    if (keysEl) {
      keysEl.addEventListener('click', function (e) {
        if (e.target.closest('.key')) {
          triggerHaptic('key');
        }
      });
    }

    // 2. Block drops in Rattle & Blocks
    var dropBtn = document.getElementById('blockDrop');
    if (dropBtn) {
      dropBtn.addEventListener('click', function () {
        triggerHaptic('drop');
      });
    }

    var blockCanvas = document.getElementById('blockCanvas');
    if (blockCanvas) {
      blockCanvas.addEventListener('pointerdown', function () {
        triggerHaptic('drop');
      });
    }

    // 3. Hidden dreams found in Nightlight rooms
    var drContainer = document.getElementById('drHidden');
    if (drContainer) {
      drContainer.addEventListener('click', function (e) {
        if (e.target.closest('.dr-item')) {
          triggerHaptic('dream');
        }
      });
    }

    updateUI();
  }

  PIP.haptics = {
    trigger: triggerHaptic,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    isSupported: isSupported,
    isQuiet: isQuiet,
    isReducedMotion: isReducedMotion,
    canVibrate: canVibrate,
    init: initHaptics,
    PATTERNS: HAPTIC_PATTERNS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      triggerHaptic: triggerHaptic,
      isEnabled: isEnabled,
      setEnabled: setEnabled,
      isSupported: isSupported,
      isQuiet: isQuiet,
      isReducedMotion: isReducedMotion,
      canVibrate: canVibrate,
      initHaptics: initHaptics,
      HAPTIC_PATTERNS: HAPTIC_PATTERNS
    };
  }
})();
