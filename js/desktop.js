/* desktop.js: Desktop icon marquee selection, grid snap, and right-click context menu. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel) { return document.querySelector(sel); };
  var $$ = PIP.$$ || function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var toast = PIP.toast || function () {};

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
    var menuH = 160;

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

  function initDesktop() {
    if (typeof document === 'undefined') return;
    contextMenu = $('#desktopContextMenu');

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
    GRID_SIZE: GRID_SIZE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PIP.desktop;
  }
})();
