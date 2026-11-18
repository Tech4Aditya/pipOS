(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};
  var store = PIP.store || {
    get: function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var MIN_DESKTOP_WIDTH = 900;
  var STORAGE_KEY = 'pip_win_positions';

  function isDesktop() {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= MIN_DESKTOP_WIDTH;
  }

  function clampCoordinates(x, y, winW, winH, viewW, viewH) {
    winW = winW || 300;
    winH = winH || 200;
    viewW = viewW || 1200;
    viewH = viewH || 800;

    // Constrain so window cannot be lost off-screen
    var minX = -(viewW - 140);
    var maxX = viewW - 140;
    var minY = -400;
    var maxY = 600;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }

  function initDraggable() {
    var windows = document.querySelectorAll('.win[data-foldable], .win#about');
    var resetBtn = document.getElementById('resetLayoutBtn');

    var positions = {};
    try {
      var raw = store.get(STORAGE_KEY, '{}');
      positions = JSON.parse(raw) || {};
    } catch (e) {
      positions = {};
    }

    function save() {
      try {
        store.set(STORAGE_KEY, JSON.stringify(positions));
      } catch (e) {}
    }

    function applyPosition(win, x, y) {
      if (!isDesktop()) {
        win.style.transform = '';
        return;
      }
      var clamped = clampCoordinates(x, y, win.offsetWidth, win.offsetHeight, window.innerWidth, window.innerHeight);
      win.style.transform = 'translate3d(' + clamped.x + 'px, ' + clamped.y + 'px, 0)';
      if (win.id) {
        positions[win.id] = { x: clamped.x, y: clamped.y };
      }
    }

    function resetLayout() {
      positions = {};
      save();
      windows.forEach(function (win) {
        win.style.transform = '';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetLayout);
    }

    // Restore saved positions
    if (isDesktop()) {
      windows.forEach(function (win) {
        if (win.id && positions[win.id]) {
          var p = positions[win.id];
          applyPosition(win, p.x, p.y);
        }
      });
    }

    // Reset when resizing below desktop width
    window.addEventListener('resize', function () {
      if (!isDesktop()) {
        windows.forEach(function (win) {
          win.style.transform = '';
        });
      } else {
        windows.forEach(function (win) {
          if (win.id && positions[win.id]) {
            applyPosition(win, positions[win.id].x, positions[win.id].y);
          }
        });
      }
    });

    windows.forEach(function (win) {
      var bar = win.querySelector('.win-bar');
      if (!bar) return;

      bar.classList.add('is-draggable');
      bar.setAttribute('tabindex', '0');
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Window bar. Drag or use arrow keys to position window.');

      var isDragging = false;
      var startX = 0, startY = 0;
      var curX = 0, curY = 0;

      if (win.id && positions[win.id]) {
        curX = positions[win.id].x || 0;
        curY = positions[win.id].y || 0;
      }

      // Pointer drag handlers
      bar.addEventListener('pointerdown', function (e) {
        if (!isDesktop()) return;
        if (e.target.closest('.win-btn') || e.target.closest('button')) return;

        isDragging = true;
        startX = e.clientX - curX;
        startY = e.clientY - curY;

        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        win.classList.add('is-dragging');
        e.preventDefault();
      });

      bar.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        curX = e.clientX - startX;
        curY = e.clientY - startY;

        applyPosition(win, curX, curY);
      });

      function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        try { bar.releasePointerCapture(e.pointerId); } catch (err) {}
        win.classList.remove('is-dragging');
        save();
      }

      bar.addEventListener('pointerup', endDrag);
      bar.addEventListener('pointercancel', endDrag);

      // Keyboard movement alternative
      bar.addEventListener('keydown', function (e) {
        if (!isDesktop()) return;
        var step = e.shiftKey ? 50 : 20;
        var handled = false;

        if (e.key === 'ArrowLeft') {
          curX -= step;
          handled = true;
        } else if (e.key === 'ArrowRight') {
          curX += step;
          handled = true;
        } else if (e.key === 'ArrowUp') {
          curY -= step;
          handled = true;
        } else if (e.key === 'ArrowDown') {
          curY += step;
          handled = true;
        }

        if (handled) {
          applyPosition(win, curX, curY);
          save();
          e.preventDefault();
        }
      });
    });

    return {
      resetLayout: resetLayout,
      positions: positions
    };
  }

  PIP.drag = {
    init: initDraggable,
    clampCoordinates: clampCoordinates,
    MIN_DESKTOP_WIDTH: MIN_DESKTOP_WIDTH
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      clampCoordinates: clampCoordinates,
      initDraggable: initDraggable,
      MIN_DESKTOP_WIDTH: MIN_DESKTOP_WIDTH
    };
  }
})();
