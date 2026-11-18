/* taskbar.js: Pip OS Start Menu & Taskbar Enhancements
   Provides an interactive vintage desktop Start Menu, quick application launcher,
   fullscreen control, keyboard navigation, and responsive taskbar management. */
(function () {
  'use strict';

  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var audio = PIP.audio || { isOn: function () { return false; }, note: function () {}, pop: function () {}, SCALE: [523, 659, 784] };

  var isOpen = false;

  function openMenu() {
    var menu = $('#startMenu');
    var btn = $('.start');
    if (!menu || !btn) return;

    isOpen = true;
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');

    if (audio.isOn()) {
      audio.note(audio.SCALE[4], { dur: 0.35, gain: 0.14 });
      audio.note(audio.SCALE[6], { dur: 0.45, gain: 0.16, when: 0.06 });
    }

    var firstItem = menu.querySelector('a, button');
    if (firstItem) firstItem.focus();
  }

  function closeMenu() {
    var menu = $('#startMenu');
    var btn = $('.start');
    if (!menu || !btn) return;

    isOpen = false;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');

    if (audio.isOn()) {
      audio.pop();
    }
  }

  function toggleMenu() {
    if (isOpen) closeMenu();
    else openMenu();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function () {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    }
  }

  function initTaskbar() {
    var startBtn = $('.start');
    var menu = $('#startMenu');
    if (!startBtn || !menu) return;

    startBtn.setAttribute('aria-haspopup', 'true');
    startBtn.setAttribute('aria-expanded', 'false');

    startBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMenu();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!isOpen) return;
      if (!menu.contains(e.target) && !startBtn.contains(e.target)) {
        closeMenu();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeMenu();
        startBtn.focus();
      }
    });

    // Action handlers inside start menu
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-start-act]');
      if (!item) return;

      var act = item.getAttribute('data-start-act');
      if (act === 'fullscreen') {
        toggleFullscreen();
        closeMenu();
      } else if (act === 'close') {
        closeMenu();
      }
    });

    // When clicking any link inside start menu, close menu and smooth scroll
    var links = menu.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
        var href = link.getAttribute('href');
        if (href && href.length > 1) {
          var targetId = href.slice(1);
          var targetWin = document.getElementById(targetId);
          if (targetWin && hasClass(targetWin, 'win')) {
            restoreWindow(targetWin);
          }
        }
      });
    });

    initWindowManager();
  }

  /* =========================================================================
     Window Manager: Z-Index Focus Stacking & Taskbar Process Pills
     ========================================================================= */
  var BASE_Z_INDEX = 10;
  var highestZIndex = BASE_Z_INDEX;
  var windowFocusBound = false;

  function addClass(el, cls) {
    if (!el) return;
    if (el.classList && el.classList.add) el.classList.add(cls);
    else {
      var c = (el.className || '').split(/\s+/).filter(Boolean);
      if (!c.includes(cls)) c.push(cls);
      el.className = c.join(' ');
    }
  }

  function removeClass(el, cls) {
    if (!el) return;
    if (el.classList && el.classList.remove) el.classList.remove(cls);
    else {
      var c = (el.className || '').split(/\s+/).filter(function (x) { return x !== cls; });
      el.className = c.join(' ');
    }
  }

  function hasClass(el, cls) {
    if (!el) return false;
    if (el.classList && el.classList.contains) return el.classList.contains(cls);
    return (el.className || '').split(/\s+/).includes(cls);
  }

  function getWindowId(win) {
    if (!win) return '';
    if (win.id) return win.id;
    var titleEl = win.querySelector ? win.querySelector('.win-title') : null;
    if (titleEl && titleEl.id) return titleEl.id.replace(/Title$/, '');
    if (win.getAttribute && win.getAttribute('id')) return win.getAttribute('id');
    var classes = (win.className || '').split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].indexOf('w-') === 0) return classes[i].slice(2);
    }
    return 'win-' + Math.random().toString(36).slice(2, 7);
  }

  function getWindowTitle(win) {
    if (!win) return 'app.exe';
    var titleEl = win.querySelector ? win.querySelector('.win-title') : null;
    if (titleEl && titleEl.textContent) return titleEl.textContent.trim();
    var id = getWindowId(win);
    return id ? id + '.exe' : 'app.exe';
  }

  function getOwnerDoc(win, fallbackDoc) {
    if (fallbackDoc) return fallbackDoc;
    if (win && win.ownerDocument) return win.ownerDocument;
    var curr = win;
    while (curr) {
      if (curr.ownerDocument) return curr.ownerDocument;
      curr = curr.parentNode;
    }
    return (typeof document !== 'undefined') ? document : null;
  }

  function getZIndex(win) {
    if (!win || !win.style) return BASE_Z_INDEX;
    var z = parseInt(win.style.zIndex, 10);
    return isNaN(z) ? BASE_Z_INDEX : z;
  }

  function bringToFront(win, customDoc) {
    if (!win) return;
    highestZIndex++;
    if (highestZIndex > 80) {
      var docRef = getOwnerDoc(win, customDoc);
      var all = docRef && docRef.querySelectorAll ? docRef.querySelectorAll('.win') : [];
      Array.prototype.slice.call(all).forEach(function (w) {
        if (w.style) w.style.zIndex = String(BASE_Z_INDEX);
      });
      highestZIndex = BASE_Z_INDEX + 1;
    }
    if (win.style) win.style.zIndex = String(highestZIndex);

    var d = getOwnerDoc(win, customDoc);
    if (d && d.querySelectorAll) {
      var allWins = d.querySelectorAll('.win');
      Array.prototype.slice.call(allWins).forEach(function (w) {
        if (w !== win) removeClass(w, 'is-focused');
      });
    }
    addClass(win, 'is-focused');
    updateTaskbarPills(d);
  }

  function minimizeWindow(win, customDoc) {
    if (!win) return;
    addClass(win, 'is-minimized');
    removeClass(win, 'is-focused');
    var body = win.querySelector ? win.querySelector('.win-body') : null;
    if (body) body.hidden = true;
    var b = win.querySelector ? win.querySelector('.win-btn') : null;
    if (b) {
      if (b.setAttribute) {
        b.setAttribute('aria-expanded', 'false');
        var title = win.querySelector ? win.querySelector('.win-title') : null;
        b.setAttribute('aria-label', 'Restore ' + (title ? title.textContent : 'window'));
      }
      b.textContent = '+';
    }
    var d = getOwnerDoc(win, customDoc);
    updateTaskbarPills(d);
    if (audio && typeof audio.isOn === 'function' && audio.isOn()) {
      audio.pop();
    }
  }

  function restoreWindow(win, customDoc) {
    if (!win) return;
    removeClass(win, 'is-minimized');
    var body = win.querySelector ? win.querySelector('.win-body') : null;
    if (body) body.hidden = false;
    var b = win.querySelector ? win.querySelector('.win-btn') : null;
    if (b) {
      if (b.setAttribute) {
        b.setAttribute('aria-expanded', 'true');
        var title = win.querySelector ? win.querySelector('.win-title') : null;
        b.setAttribute('aria-label', 'Minimize ' + (title ? title.textContent : 'window'));
      }
      b.textContent = '−';
    }
    bringToFront(win, customDoc);
    if (typeof win.scrollIntoView === 'function') {
      var reduce = PIP.reduceMotion;
      win.scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
    }
    var d = getOwnerDoc(win, customDoc);
    updateTaskbarPills(d);
    if (audio && typeof audio.isOn === 'function' && audio.isOn()) {
      audio.note(audio.SCALE[4], { dur: 0.25, gain: 0.12 });
    }
  }

  function toggleWindow(win, customDoc) {
    if (!win) return;
    var body = win.querySelector ? win.querySelector('.win-body') : null;
    var isMin = hasClass(win, 'is-minimized') || (body && body.hidden);
    var isFoc = hasClass(win, 'is-focused');

    if (isMin) {
      restoreWindow(win, customDoc);
    } else if (isFoc) {
      minimizeWindow(win, customDoc);
    } else {
      bringToFront(win, customDoc);
      if (typeof win.scrollIntoView === 'function') {
        var reduce = PIP.reduceMotion;
        win.scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
      }
    }
  }

  function getFocusedWindow(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelector) return null;
    return d.querySelector('.win.is-focused');
  }

  function updateTaskbarPills(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return;
    var container = d.getElementById ? d.getElementById('taskbarRunning') : (d.querySelector ? d.querySelector('#taskbarRunning') : null);
    if (!container) return;

    var windows = d.querySelectorAll ? d.querySelectorAll('.win[data-foldable]') : [];
    if (!windows || !windows.length) return;

    var winArray = Array.prototype.slice.call(windows);
    winArray.forEach(function (win) {
      var winId = getWindowId(win);
      var pill = container.querySelector ? container.querySelector('[data-win-id="' + winId + '"]') : null;
      var body = win.querySelector ? win.querySelector('.win-body') : null;
      var isMin = hasClass(win, 'is-minimized') || (body && body.hidden);
      var isFoc = hasClass(win, 'is-focused');

      if (!pill) {
        pill = d.createElement('button');
        pill.type = 'button';
        pill.className = 'taskbar-pill taskbar-item';
        if (pill.setAttribute) {
          pill.setAttribute('data-win-id', winId);
          var titleText = getWindowTitle(win);
          pill.setAttribute('aria-label', titleText + ' process');
          pill.setAttribute('title', titleText);
        }

        var dot = d.createElement('span');
        dot.className = 'taskbar-pill-dot taskbar-indicator';
        if (dot.setAttribute) dot.setAttribute('aria-hidden', 'true');

        var label = d.createElement('span');
        label.className = 'taskbar-pill-title';
        label.textContent = getWindowTitle(win);

        pill.appendChild(dot);
        pill.appendChild(label);

        if (pill.addEventListener) {
          pill.addEventListener('click', function (e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            toggleWindow(win);
          });
        }

        container.appendChild(pill);
      }

      if (isMin) {
        addClass(pill, 'is-minimized');
        removeClass(pill, 'is-focused');
        removeClass(pill, 'is-active');
        if (pill.setAttribute) pill.setAttribute('aria-pressed', 'false');
      } else if (isFoc) {
        removeClass(pill, 'is-minimized');
        addClass(pill, 'is-focused');
        addClass(pill, 'is-active');
        if (pill.setAttribute) pill.setAttribute('aria-pressed', 'true');
      } else {
        removeClass(pill, 'is-minimized');
        removeClass(pill, 'is-focused');
        removeClass(pill, 'is-active');
        addClass(pill, 'is-open');
        if (pill.setAttribute) pill.setAttribute('aria-pressed', 'false');
      }
    });
  }

  function initWindowFocusListeners(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.addEventListener || windowFocusBound) return;
    windowFocusBound = true;

    d.addEventListener('pointerdown', function (e) {
      var win = e.target && e.target.closest ? e.target.closest('.win') : null;
      if (win) {
        bringToFront(win);
      }
    });

    d.addEventListener('focusin', function (e) {
      var win = e.target && e.target.closest ? e.target.closest('.win') : null;
      if (win) {
        bringToFront(win);
      }
    });
  }

  function initWindowManager(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return;

    var windows = d.querySelectorAll ? d.querySelectorAll('.win[data-foldable]') : [];
    Array.prototype.slice.call(windows).forEach(function (win) {
      if (win.style && !win.style.zIndex) {
        win.style.zIndex = String(BASE_Z_INDEX);
      }
    });

    initWindowFocusListeners(d);
    updateTaskbarPills(d);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTaskbar);
    } else {
      initTaskbar();
    }
  }

  var taskbarAPI = {
    init: initTaskbar,
    openMenu: openMenu,
    closeMenu: closeMenu,
    toggleMenu: toggleMenu,
    toggleFullscreen: toggleFullscreen,
    isOpen: function () { return isOpen; },
    initWindowManager: initWindowManager,
    bringToFront: bringToFront,
    minimizeWindow: minimizeWindow,
    restoreWindow: restoreWindow,
    toggleWindow: toggleWindow,
    getFocusedWindow: getFocusedWindow,
    getZIndex: getZIndex,
    updateTaskbar: updateTaskbarPills
  };

  PIP.taskbar = taskbarAPI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = taskbarAPI;
  }
})();
