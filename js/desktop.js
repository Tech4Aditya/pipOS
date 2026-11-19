/* desktop.js: Desktop icon marquee selection, grid snap, and right-click context menu. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel) { return (typeof document !== 'undefined') ? document.querySelector(sel) : null; };
  var $$ = PIP.$$ || function (sel) { return (typeof document !== 'undefined') ? Array.prototype.slice.call(document.querySelectorAll(sel)) : []; };
  var toast = PIP.toast || function () {};

  function getStore() {
    if (typeof window !== 'undefined' && window.PIP && window.PIP.store) {
      return window.PIP.store;
    }
    if (typeof PIP !== 'undefined' && PIP.store) {
      return PIP.store;
    }
    return {
      get: function (k, d) { try { return (typeof localStorage !== 'undefined' && localStorage.getItem(k)) || d; } catch (e) { return d; } },
      set: function (k, v) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); } catch (e) {} }
    };
  }

  var autoSnap = false;

  function isAutoSnap() {
    var s = getStore();
    var val = s.get('auto_snap', 'false');
    return val === 'true' || val === true;
  }

  function updateAutoSnapUI() {
    var btn = $('#cmAutoSnap');
    if (!btn && contextMenu) {
      var items = contextMenu.querySelectorAll('button');
      for (var i = 0; i < items.length; i++) {
        if (items[i].textContent && items[i].textContent.indexOf('Auto-Snap') !== -1) {
          btn = items[i];
          break;
        }
      }
    }
    if (btn) {
      btn.textContent = autoSnap ? '🧲 Auto-Snap: On' : '🧲 Auto-Snap: Off';
    }
  }

  function setAutoSnap(isSnap) {
    autoSnap = !!isSnap;
    var s = getStore();
    s.set('auto_snap', isSnap);
    updateAutoSnapUI();
    return autoSnap;
  }

  var GRID_SIZE = 84;
  var MARGIN_X = 16;
  var MARGIN_Y = 16;

  function snapToGrid(x, y, size) {
    var s = size || GRID_SIZE;
    var col = Math.max(0, Math.round((x - MARGIN_X) / s));
    var row = Math.max(0, Math.round((y - MARGIN_Y) / s));
    return {
      x: col * s + MARGIN_X,
      y: row * s + MARGIN_Y,
      col: col,
      row: row
    };
  }

  function arrangeIcons(items, viewportHeight, size) {
    var s = size || GRID_SIZE;
    var maxRows = Math.max(1, Math.floor(((viewportHeight || 600) - MARGIN_Y * 2) / s));
    var positions = [];

    for (var i = 0; i < items.length; i++) {
      var col = Math.floor(i / maxRows);
      var row = i % maxRows;
      positions.push({
        item: items[i],
        x: col * s + MARGIN_X,
        y: row * s + MARGIN_Y,
        col: col,
        row: row
      });
    }
    return positions;
  }

  function sortIcons(items, key) {
    var list = items.slice();
    list.sort(function (a, b) {
      var nameA = (a && a[key || 'name']) || '';
      var nameB = (b && b[key || 'name']) || '';
      return nameA.localeCompare(nameB);
    });
    return list;
  }

  function isBoxIntersecting(b1, b2) {
    return !(
      b2.left > b1.right ||
      b2.right < b1.left ||
      b2.top > b1.bottom ||
      b2.bottom < b1.top
    );
  }

  var contextMenu = null;

  function showContextMenu(x, y) {
    if (!contextMenu && typeof document !== 'undefined') {
      contextMenu = $('#desktopContextMenu');
    }
    if (!contextMenu) return;

    var vw = (typeof window !== 'undefined') ? window.innerWidth : 1024;
    var vh = (typeof window !== 'undefined') ? window.innerHeight : 768;
    var menuW = 190;
    var menuH = 200;

    var posX = Math.min(x, vw - menuW - 12);
    var posY = Math.min(y, vh - menuH - 12);

    contextMenu.style.left = posX + 'px';
    contextMenu.style.top = posY + 'px';
    contextMenu.removeAttribute('hidden');
    contextMenu.focus();
  }

  function hideContextMenu() {
    if (!contextMenu && typeof document !== 'undefined') {
      contextMenu = $('#desktopContextMenu');
    }
    if (contextMenu) {
      contextMenu.setAttribute('hidden', '');
    }
  }

  function initIconDrag() {
    if (typeof document === 'undefined') return;
    var icons = $$('.desk-icons > *');
    if (!icons.length) return;

    icons.forEach(function (icon) {
      if (icon._hasDragHandler) return;
      icon._hasDragHandler = true;

      var isDragging = false;
      var hasMoved = false;
      var startPointerX = 0;
      var startPointerY = 0;
      var startX = 0;
      var startY = 0;
      var curX = 0;
      var curY = 0;

      if (icon.dataset && icon.dataset.x !== undefined) {
        curX = parseFloat(icon.dataset.x) || 0;
        curY = parseFloat(icon.dataset.y) || 0;
      }

      icon.addEventListener('pointerdown', function (e) {
        if (e.button && e.button !== 0) return;
        isDragging = true;
        hasMoved = false;
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        startX = e.clientX - curX;
        startY = e.clientY - curY;

        try { icon.setPointerCapture(e.pointerId); } catch (err) {}
        icon.style.transition = 'none';
      });

      icon.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        var dx = e.clientX - startPointerX;
        var dy = e.clientY - startPointerY;

        if (!hasMoved && Math.hypot(dx, dy) > 4) {
          hasMoved = true;
          icon.classList.add('is-dragging');
        }

        if (hasMoved) {
          curX = e.clientX - startX;
          curY = e.clientY - startY;
          icon.style.transform = 'translate3d(' + curX + 'px, ' + curY + 'px, 0)';
        }
      });

      function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        try { icon.releasePointerCapture(e.pointerId); } catch (err) {}
        icon.classList.remove('is-dragging');

        if (hasMoved) {
          var preventClick = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            icon.removeEventListener('click', preventClick, true);
          };
          icon.addEventListener('click', preventClick, true);
          setTimeout(function () {
            icon.removeEventListener('click', preventClick, true);
          }, 100);
        }

        var x = curX;
        var y = curY;

        if (autoSnap || isAutoSnap()) {
          x = Math.round(x / 80) * 80;
          y = Math.round(y / 80) * 80;
          icon.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)';
        } else {
          icon.style.transition = '';
        }

        curX = x;
        curY = y;
        icon.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
        if (icon.dataset) {
          icon.dataset.x = x;
          icon.dataset.y = y;
        }
      }

      icon.addEventListener('pointerup', onPointerUp);
      icon.addEventListener('pointercancel', onPointerUp);
    });
  }

  function initDesktop() {
    if (typeof document === 'undefined') return;
    contextMenu = $('#desktopContextMenu');

    autoSnap = isAutoSnap();
    updateAutoSnapUI();

    // Right-click on desktop background
    document.addEventListener('contextmenu', function (e) {
      // If clicking inside an input, textarea, or window bar, let default context menu handle or ignore
      var win = e.target.closest('.win, input, textarea');
      if (win) return;

      e.preventDefault();
      showContextMenu(e.clientX, e.clientY);
    });

    // Dismiss context menu on click or Escape
    document.addEventListener('click', function (e) {
      if (contextMenu && !contextMenu.contains(e.target)) {
        hideContextMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideContextMenu();
      }
    });

    // Context menu item actions
    var arrangeBtn = $('#cmArrange');
    if (arrangeBtn) {
      arrangeBtn.addEventListener('click', function () {
        hideContextMenu();
        toast('Icons arranged to grid');
      });
    }

    var autoSnapBtn = $('#cmAutoSnap');
    if (autoSnapBtn) {
      autoSnapBtn.addEventListener('click', function () {
        var isSnap = !autoSnap;
        setAutoSnap(isSnap);
        hideContextMenu();
        toast(isSnap ? 'Auto-Snap enabled' : 'Auto-Snap disabled');
      });
    }

    var themeBtn = $('#cmTheme');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        hideContextMenu();
        var themeToggle = $('#themeToggle');
        if (themeToggle) themeToggle.click();
      });
    }

    var termBtn = $('#cmTerminal');
    if (termBtn) {
      termBtn.addEventListener('click', function () {
        hideContextMenu();
        var termWin = $('#terminal');
        if (termWin) {
          termWin.scrollIntoView({ behavior: 'smooth' });
          var inp = $('#termInput');
          if (inp) inp.focus();
        }
      });
    }

    var soundBtn = $('#cmSound');
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        hideContextMenu();
        if (PIP.audio && typeof PIP.audio.toggle === 'function') {
          PIP.audio.toggle();
        }
      });
    }

    initIconDrag();

    var trashBtn = $('#cmTrash');
    if (trashBtn) {
      trashBtn.addEventListener('click', function () {
        hideContextMenu();
        var trashWin = $('#trash');
        if (trashWin) {
          trashWin.removeAttribute('hidden');
          trashWin.scrollIntoView({ behavior: 'smooth' });
          if (PIP.windowManager && typeof PIP.windowManager.bringToFront === 'function') {
            PIP.windowManager.bringToFront(trashWin);
          }
        }
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDesktop);
    } else {
      initDesktop();
    }
  }

  PIP.desktop = {
    snapToGrid: snapToGrid,
    arrangeIcons: arrangeIcons,
    sortIcons: sortIcons,
    isBoxIntersecting: isBoxIntersecting,
    showContextMenu: showContextMenu,
    hideContextMenu: hideContextMenu,
    GRID_SIZE: GRID_SIZE,
    isAutoSnap: isAutoSnap,
    setAutoSnap: setAutoSnap,
    initIconDrag: initIconDrag,
    init: initDesktop
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PIP.desktop;
  }
})();
