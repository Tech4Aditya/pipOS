/* window-manager.js: PipOS Window Manager 2.0 (pip-wm)
   Provides retro desktop window orchestration: dynamic z-index layering,
   maximize / restore states, Aero Edge Snapping (50/50 split), and keyboard controls.
   100% build-free and zero-dependency. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var currentTopZ = 100;
  var focusedWin = null;

  function $(sel, r) {
    if (root.PIP && root.PIP.$) return root.PIP.$(sel, r);
    return (r || document).querySelector(sel);
  }

  function $$(sel, r) {
    if (root.PIP && root.PIP.$$) return root.PIP.$$(sel, r);
    return Array.prototype.slice.call((r || document).querySelectorAll(sel));
  }

  // Elevate active window z-index and manage focused class
  function bringToFront(win) {
    if (!win) return;
    currentTopZ += 1;
    win.style.zIndex = currentTopZ;

    if (focusedWin && focusedWin !== win) {
      focusedWin.classList.remove('is-focused');
    }
    win.classList.add('is-focused');
    focusedWin = win;

    // Dispatch custom window focus event for screen readers and taskbar
    if (root.document && typeof root.CustomEvent === 'function') {
      root.document.dispatchEvent(new CustomEvent('pip-window-focus', { detail: { id: win.id } }));
    }
  }

  // Toggle maximize state
  function toggleMaximize(win) {
    if (!win) return;
    bringToFront(win);

    var isMax = win.classList.contains('is-maximized');
    if (isMax) {
      restore(win);
    } else {
      maximize(win);
    }
  }

  function maximize(win) {
    if (!win) return;
    // Record original styling if previously styled
    win.dataset.origStyle = win.getAttribute('style') || '';
    win.classList.remove('is-snapped-left', 'is-snapped-right');
    win.classList.add('is-maximized');

    var maxBtn = win.querySelector('.win-btn-max');
    if (maxBtn) {
      maxBtn.setAttribute('aria-label', 'Restore window');
      maxBtn.textContent = '🗗';
    }
  }

  function restore(win) {
    if (!win) return;
    win.classList.remove('is-maximized', 'is-snapped-left', 'is-snapped-right');

    if (win.dataset.origStyle) {
      win.setAttribute('style', win.dataset.origStyle);
    }

    var maxBtn = win.querySelector('.win-btn-max');
    if (maxBtn) {
      maxBtn.setAttribute('aria-label', 'Maximize window');
      maxBtn.textContent = '🗖';
    }
  }

  // Snap window to 50% left or right screen boundary
  function snap(win, side) {
    if (!win) return;
    bringToFront(win);
    win.classList.remove('is-maximized', 'is-snapped-left', 'is-snapped-right');

    if (side === 'left') {
      win.classList.add('is-snapped-left');
    } else if (side === 'right') {
      win.classList.add('is-snapped-right');
    }
  }

  // Inject maximize buttons into all .win titlebars if not present
  function injectWindowControls() {
    if (!root.document) return;
    $$('.win').forEach(function (win) {
      var bar = win.querySelector('.win-bar');
      if (!bar) return;

      // Bring to front on pointerdown anywhere inside the window
      win.addEventListener('pointerdown', function () {
        bringToFront(win);
      });

      // Avoid injecting multiple controls
      if (bar.querySelector('.win-btn-max')) return;

      var actionsWrap = bar.querySelector('.win-actions');
      if (!actionsWrap) {
        actionsWrap = document.createElement('div');
        actionsWrap.className = 'win-actions';
        bar.appendChild(actionsWrap);
      }

      var maxBtn = document.createElement('button');
      maxBtn.type = 'button';
      maxBtn.className = 'win-btn win-btn-max';
      maxBtn.setAttribute('aria-label', 'Maximize window');
      maxBtn.textContent = '🗖';
      maxBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMaximize(win);
      });

      actionsWrap.appendChild(maxBtn);

      // Title bar double-click toggles maximize/restore
      bar.addEventListener('dblclick', function (e) {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          toggleMaximize(win);
        }
      });
    });
  }

  function init() {
    injectWindowControls();

    // Global keyboard shortcuts for window management: Alt + Up (Maximize), Alt + Down (Restore)
    if (root.document) {
      root.document.addEventListener('keydown', function (e) {
        if (e.altKey && focusedWin) {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            maximize(focusedWin);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            restore(focusedWin);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            snap(focusedWin, 'left');
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            snap(focusedWin, 'right');
          }
        }
      });
    }
  }

  var WindowManager = {
    init: init,
    bringToFront: bringToFront,
    maximize: maximize,
    restore: restore,
    toggleMaximize: toggleMaximize,
    snap: snap,
    getFocusedWindow: function () { return focusedWin; },
    getTopZ: function () { return currentTopZ; }
  };

  PIP.wm = WindowManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
  }
})();
