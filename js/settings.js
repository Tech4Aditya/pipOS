/* settings.js: PipOS Desktop Control Panel & System Customizer (pip-settings.exe)
   Manages personalized accent palettes, wallpaper aesthetics, audio levels,
   night shift display warmth, and storage management. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  var STORAGE_KEY = 'pipOS:settings';

  var DEFAULTS = {
    accent: 'berry',
    wallpaper: 'dots',
    fontScale: 'normal',
    nightShift: 0,
    masterVolume: 80,
    soundMuted: false,
    chimes: true
  };

  var VALID_ACCENTS = ['berry', 'cyan', 'gold', 'sage', 'lavender'];
  var VALID_WALLPAPERS = ['dots', 'scanlines', 'stars', 'grid', 'gradient'];
  var VALID_FONTS = ['compact', 'normal', 'cozy'];

  var state = {};

  function copyDefaults() {
    return {
      accent: DEFAULTS.accent,
      wallpaper: DEFAULTS.wallpaper,
      fontScale: DEFAULTS.fontScale,
      nightShift: DEFAULTS.nightShift,
      masterVolume: DEFAULTS.masterVolume,
      soundMuted: DEFAULTS.soundMuted,
      chimes: DEFAULTS.chimes
    };
  }

  function getStorage() {
    if (typeof root.localStorage !== 'undefined') {
      return root.localStorage;
    }
    return null;
  }

  function loadSettings() {
    var s = copyDefaults();
    var storage = getStorage();
    if (!storage) return s;

    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (VALID_ACCENTS.indexOf(parsed.accent) !== -1) s.accent = parsed.accent;
          if (VALID_WALLPAPERS.indexOf(parsed.wallpaper) !== -1) s.wallpaper = parsed.wallpaper;
          if (VALID_FONTS.indexOf(parsed.fontScale) !== -1) s.fontScale = parsed.fontScale;
          if (typeof parsed.nightShift === 'number' && !isNaN(parsed.nightShift)) {
            s.nightShift = Math.max(0, Math.min(50, Math.round(parsed.nightShift)));
          }
          if (typeof parsed.masterVolume === 'number' && !isNaN(parsed.masterVolume)) {
            s.masterVolume = Math.max(0, Math.min(100, Math.round(parsed.masterVolume)));
          }
          if (typeof parsed.soundMuted === 'boolean') s.soundMuted = parsed.soundMuted;
          if (typeof parsed.chimes === 'boolean') s.chimes = parsed.chimes;
        }
      }
    } catch (e) {
      // Fallback to defaults on corrupted payload
    }
    return s;
  }

  function saveSettings() {
    var storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function applySettings() {
    if (typeof document === 'undefined') return;
    var html = document.documentElement;
    if (!html) return;

    // Apply attributes
    html.setAttribute('data-accent', state.accent);
    html.setAttribute('data-wallpaper', state.wallpaper);
    html.setAttribute('data-font-scale', state.fontScale);

    // Apply night shift display warmth
    var overlay = document.getElementById('pipNightOverlay');
    var opacity = (state.nightShift / 100).toFixed(2);
    if (overlay) {
      overlay.style.opacity = opacity;
    }
    html.style.setProperty('--night-shift-opacity', opacity);

    // Sync audio if available
    if (PIP.audio) {
      if (typeof PIP.audio.setVolume === 'function') {
        PIP.audio.setVolume(state.masterVolume / 100);
      }
    }

    // Dispatch reactive change event
    if (typeof document.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      try {
        document.dispatchEvent(new CustomEvent('pip-settings-changed', {
          detail: getAll()
        }));
      } catch (e) {}
    }
  }

  function get(key) {
    if (state.hasOwnProperty(key)) {
      return state[key];
    }
    return DEFAULTS[key];
  }

  function set(key, value) {
    if (!DEFAULTS.hasOwnProperty(key)) return false;

    if (key === 'accent') {
      if (VALID_ACCENTS.indexOf(value) === -1) return false;
      state.accent = value;
    } else if (key === 'wallpaper') {
      if (VALID_WALLPAPERS.indexOf(value) === -1) return false;
      state.wallpaper = value;
    } else if (key === 'fontScale') {
      if (VALID_FONTS.indexOf(value) === -1) return false;
      state.fontScale = value;
    } else if (key === 'nightShift') {
      var ns = parseInt(value, 10);
      if (isNaN(ns)) return false;
      state.nightShift = Math.max(0, Math.min(50, ns));
    } else if (key === 'masterVolume') {
      var mv = parseInt(value, 10);
      if (isNaN(mv)) return false;
      state.masterVolume = Math.max(0, Math.min(100, mv));
    } else if (key === 'soundMuted') {
      state.soundMuted = !!value;
    } else if (key === 'chimes') {
      state.chimes = !!value;
    }

    saveSettings();
    applySettings();
    return true;
  }

  function getAll() {
    return {
      accent: state.accent,
      wallpaper: state.wallpaper,
      fontScale: state.fontScale,
      nightShift: state.nightShift,
      masterVolume: state.masterVolume,
      soundMuted: state.soundMuted,
      chimes: state.chimes
    };
  }

  function reset() {
    state = copyDefaults();
    saveSettings();
    applySettings();
    return getAll();
  }

  function getStorageUsage() {
    var storage = getStorage();
    if (!storage) {
      return { totalBytes: 0, items: [] };
    }

    var totalBytes = 0;
    var items = [];
    try {
      for (var i = 0; i < storage.length; i++) {
        var key = storage.key(i);
        if (key) {
          var val = storage.getItem(key) || '';
          var bytes = (key.length + val.length) * 2; // UTF-16 approx
          totalBytes += bytes;
          items.push({ key: key, bytes: bytes });
        }
      }
    } catch (e) {}

    items.sort(function (a, b) { return b.bytes - a.bytes; });
    return {
      totalBytes: totalBytes,
      totalKB: (totalBytes / 1024).toFixed(2),
      items: items
    };
  }

  function initUI() {
    if (typeof document === 'undefined') return;

    var win = document.getElementById('settings');
    if (!win) return;

    // Tab buttons
    var tabs = win.querySelectorAll('.settings-tab-btn');
    var panels = win.querySelectorAll('.settings-panel');

    function switchTab(targetTabId) {
      tabs.forEach(function (btn) {
        var isTarget = btn.getAttribute('data-tab') === targetTabId;
        btn.classList.toggle('is-active', isTarget);
        btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var isTarget = p.id === targetTabId;
        p.classList.toggle('is-active', isTarget);
        if (isTarget) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      });
    });

    // Accent buttons
    var accentBtns = win.querySelectorAll('.settings-accent-btn');
    accentBtns.forEach(function (btn) {
      var acc = btn.getAttribute('data-accent');
      btn.classList.toggle('is-active', acc === state.accent);
      btn.addEventListener('click', function () {
        set('accent', acc);
        accentBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-accent') === state.accent);
        });
      });
    });

    // Wallpaper buttons
    var wpBtns = win.querySelectorAll('.settings-wp-btn');
    wpBtns.forEach(function (btn) {
      var wp = btn.getAttribute('data-wp');
      btn.classList.toggle('is-active', wp === state.wallpaper);
      btn.addEventListener('click', function () {
        set('wallpaper', wp);
        wpBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-wp') === state.wallpaper);
        });
      });
    });

    // Font Scale buttons
    var fontBtns = win.querySelectorAll('.settings-font-btn');
    fontBtns.forEach(function (btn) {
      var f = btn.getAttribute('data-font');
      btn.classList.toggle('is-active', f === state.fontScale);
      btn.addEventListener('click', function () {
        set('fontScale', f);
        fontBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-font') === state.fontScale);
        });
      });
    });

    // Night Shift slider
    var nsSlider = document.getElementById('settingsNightShift');
    var nsVal = document.getElementById('settingsNightShiftVal');
    if (nsSlider) {
      nsSlider.value = state.nightShift;
      if (nsVal) nsVal.textContent = state.nightShift + '%';
      nsSlider.addEventListener('input', function () {
        var val = parseInt(nsSlider.value, 10);
        set('nightShift', val);
        if (nsVal) nsVal.textContent = val + '%';
      });
    }

    // Volume slider
    var volSlider = document.getElementById('settingsVolSlider');
    var volVal = document.getElementById('settingsVolVal');
    if (volSlider) {
      volSlider.value = state.masterVolume;
      if (volVal) volVal.textContent = state.masterVolume + '%';
      volSlider.addEventListener('input', function () {
        var val = parseInt(volSlider.value, 10);
        set('masterVolume', val);
        if (volVal) volVal.textContent = val + '%';
      });
    }

    // Chimes toggle
    var chimesToggle = document.getElementById('settingsChimesToggle');
    if (chimesToggle) {
      chimesToggle.checked = state.chimes;
      chimesToggle.addEventListener('change', function () {
        set('chimes', chimesToggle.checked);
      });
    }

    // Reset button
    var resetBtn = document.getElementById('settingsResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (typeof root.confirm === 'function' && !root.confirm('Reset all pipOS desktop customizations to factory defaults?')) {
          return;
        }
        reset();
        // Update all UI elements
        accentBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-accent') === state.accent);
        });
        wpBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-wp') === state.wallpaper);
        });
        fontBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-font') === state.fontScale);
        });
        if (nsSlider) {
          nsSlider.value = state.nightShift;
          if (nsVal) nsVal.textContent = state.nightShift + '%';
        }
        if (volSlider) {
          volSlider.value = state.masterVolume;
          if (volVal) volVal.textContent = state.masterVolume + '%';
        }
        if (chimesToggle) {
          chimesToggle.checked = state.chimes;
        }
        if (PIP.toast) {
          PIP.toast('Settings restored to factory defaults');
        }
      });
    }

    // Storage summary
    var refreshStorageBtn = document.getElementById('settingsRefreshStorage');
    var storageList = document.getElementById('settingsStorageList');
    var storageTotal = document.getElementById('settingsStorageTotal');

    function renderStorage() {
      if (!storageList || !storageTotal) return;
      var usage = getStorageUsage();
      storageTotal.textContent = usage.totalKB + ' KB total';
      storageList.innerHTML = '';
      if (usage.items.length === 0) {
        var emptyLi = document.createElement('li');
        emptyLi.textContent = 'No local storage keys saved';
        storageList.appendChild(emptyLi);
        return;
      }
      usage.items.slice(0, 10).forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'storage-item';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'storage-key';
        nameSpan.textContent = item.key;
        var sizeSpan = document.createElement('span');
        sizeSpan.className = 'storage-size';
        sizeSpan.textContent = (item.bytes / 1024).toFixed(2) + ' KB';
        li.appendChild(nameSpan);
        li.appendChild(sizeSpan);
        storageList.appendChild(li);
      });
    }

    if (refreshStorageBtn) {
      refreshStorageBtn.addEventListener('click', renderStorage);
    }
    renderStorage();

    // Context menu integration if cmSettings exists
    var cmSettings = document.getElementById('cmSettings');
    if (cmSettings) {
      cmSettings.addEventListener('click', function () {
        if (PIP.desktop && typeof PIP.desktop.hideContextMenu === 'function') {
          PIP.desktop.hideContextMenu();
        }
        win.scrollIntoView({ behavior: 'smooth' });
        if (PIP.windowManager && typeof PIP.windowManager.bringToFront === 'function') {
          PIP.windowManager.bringToFront(win);
        }
      });
    }
  }

  // Initialize state
  state = loadSettings();
  applySettings();

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  // Export module API
  var api = {
    get: get,
    set: set,
    getAll: getAll,
    reset: reset,
    applyAll: applySettings,
    getStorageUsage: getStorageUsage,
    DEFAULTS: DEFAULTS,
    VALID_ACCENTS: VALID_ACCENTS,
    VALID_WALLPAPERS: VALID_WALLPAPERS,
    VALID_FONTS: VALID_FONTS,
    initUI: initUI
  };

  PIP.settings = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
