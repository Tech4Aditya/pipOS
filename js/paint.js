/* paint.js: Retro Pixel Art & Nursery Painter (pip-paint.exe)
   A cozy 16x16 and 32x32 pixel art studio featuring pencil, eraser, flood fill bucket,
   eyedropper, undo/redo history stack, and crisp scaled PNG export. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  var PALETTE = [
    '#a34063', // Berry Pink
    '#7a2f55', // Deep Berry
    '#f7dfe4', // Blush Rose
    '#ffe9ae', // Butter Yellow
    '#f3b562', // Amber Gold
    '#fff8f1', // Cream Peach
    '#cfeadb', // Mint Sage
    '#3b7a57', // Forest Emerald
    '#d6e6f5', // Sky Blue
    '#0d828a', // Ocean Teal
    '#c3b1e1', // Lavender
    '#2a2145', // Midnight Violet
    '#5c4033', // Warm Ink Brown
    '#8c827a', // Slate Grey
    '#ffffff', // Crisp White
    '#1b1430'  // Night Black
  ];

  function createGrid(size) {
    var s = size || 16;
    var g = [];
    for (var y = 0; y < s; y++) {
      var row = [];
      for (var x = 0; x < s; x++) {
        row.push(null);
      }
      g.push(row);
    }
    return g;
  }

  function cloneGrid(grid) {
    var copy = [];
    for (var y = 0; y < grid.length; y++) {
      copy.push(grid[y].slice());
    }
    return copy;
  }

  function floodFill(grid, startX, startY, targetColor, fillColor) {
    if (!grid || !grid.length) return grid;
    var size = grid.length;
    if (startX < 0 || startX >= size || startY < 0 || startY >= size) return grid;

    var original = grid[startY][startX];
    if (original === fillColor) return grid;

    var queue = [[startX, startY]];
    var visited = {};

    while (queue.length > 0) {
      var pt = queue.pop();
      var x = pt[0];
      var y = pt[1];
      var key = x + ',' + y;

      if (visited[key]) continue;
      visited[key] = true;

      if (grid[y][x] === original) {
        grid[y][x] = fillColor;

        if (x > 0 && !visited[(x - 1) + ',' + y]) queue.push([x - 1, y]);
        if (x < size - 1 && !visited[(x + 1) + ',' + y]) queue.push([x + 1, y]);
        if (y > 0 && !visited[x + ',' + (y - 1)]) queue.push([x, y - 1]);
        if (y < size - 1 && !visited[x + ',' + (y + 1)]) queue.push([x, y + 1]);
      }
    }
    return grid;
  }

  var state = {
    size: 16,
    grid: createGrid(16),
    color: PALETTE[0],
    tool: 'pencil', // 'pencil', 'eraser', 'bucket', 'picker'
    history: [],
    historyIndex: -1,
    maxHistory: 20
  };

  function pushHistory() {
    // If not at end of history, truncate redo states
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(cloneGrid(state.grid));
    if (state.history.length > state.maxHistory) {
      state.history.shift();
    }
    state.historyIndex = state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.grid = cloneGrid(state.history[state.historyIndex]);
      renderCanvas();
      return true;
    }
    return false;
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.grid = cloneGrid(state.history[state.historyIndex]);
      renderCanvas();
      return true;
    }
    return false;
  }

  function setPixel(x, y, color) {
    if (x >= 0 && x < state.size && y >= 0 && y < state.size) {
      state.grid[y][x] = color;
      return true;
    }
    return false;
  }

  function getPixel(x, y) {
    if (x >= 0 && x < state.size && y >= 0 && y < state.size) {
      return state.grid[y][x];
    }
    return null;
  }

  function clearCanvas() {
    pushHistory();
    state.grid = createGrid(state.size);
    pushHistory();
    renderCanvas();
  }

  function setGridSize(newSize) {
    if (newSize !== 16 && newSize !== 32) return false;
    state.size = newSize;
    state.grid = createGrid(newSize);
    state.history = [];
    state.historyIndex = -1;
    pushHistory();
    renderCanvas();
    return true;
  }

  var canvasEl = null;
  var ctx = null;

  function renderCanvas() {
    if (!canvasEl) {
      if (typeof document !== 'undefined') {
        canvasEl = document.getElementById('paintCanvas');
      }
    }
    if (!canvasEl) return;
    if (!ctx) ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    var w = canvasEl.width;
    var h = canvasEl.height;
    var cellSize = w / state.size;

    ctx.clearRect(0, 0, w, h);

    // Draw checkerboard background for transparency
    var checkSize = cellSize / 2;
    for (var r = 0; r < state.size * 2; r++) {
      for (var c = 0; c < state.size * 2; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#f0f0f0';
        ctx.fillRect(c * checkSize, r * checkSize, checkSize, checkSize);
      }
    }

    // Draw pixels
    for (var y = 0; y < state.size; y++) {
      for (var x = 0; x < state.size; x++) {
        var col = state.grid[y][x];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw faint grid overlay
    ctx.strokeStyle = 'rgba(92, 64, 51, 0.12)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= state.size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(w, i * cellSize);
      ctx.stroke();
    }
  }

  function exportPNG(exportScale) {
    if (typeof document === 'undefined') return null;
    var scale = exportScale || 16;
    var outW = state.size * scale;
    var outH = state.size * scale;

    var offscreen = document.createElement('canvas');
    offscreen.width = outW;
    offscreen.height = outH;
    var offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    offCtx.imageSmoothingEnabled = false;

    for (var y = 0; y < state.size; y++) {
      for (var x = 0; x < state.size; x++) {
        var col = state.grid[y][x];
        if (col) {
          offCtx.fillStyle = col;
          offCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    return offscreen.toDataURL('image/png');
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('paint');
    if (!win) return;

    canvasEl = document.getElementById('paintCanvas');
    if (canvasEl) ctx = canvasEl.getContext('2d');

    // Initial history snapshot
    pushHistory();
    renderCanvas();

    // Tools handling
    var toolBtns = win.querySelectorAll('.paint-tool-btn');
    toolBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-tool');
        if (t) {
          state.tool = t;
          toolBtns.forEach(function (b) {
            var active = b.getAttribute('data-tool') === state.tool;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
        }
      });
    });

    // Palette handling
    var paletteContainer = document.getElementById('paintPalette');
    if (paletteContainer) {
      paletteContainer.innerHTML = '';
      PALETTE.forEach(function (col, idx) {
        var swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'paint-swatch' + (col === state.color ? ' is-active' : '');
        swatch.style.backgroundColor = col;
        swatch.setAttribute('aria-label', 'Color ' + col);
        swatch.addEventListener('click', function () {
          state.color = col;
          paletteContainer.querySelectorAll('.paint-swatch').forEach(function (s) {
            s.classList.remove('is-active');
          });
          swatch.classList.add('is-active');
          if (state.tool === 'eraser') {
            state.tool = 'pencil';
            toolBtns.forEach(function (b) {
              var active = b.getAttribute('data-tool') === 'pencil';
              b.classList.toggle('is-active', active);
              b.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
          }
        });
        paletteContainer.appendChild(swatch);
      });
    }

    // Size selector
    var sizeSel = document.getElementById('paintSizeSelect');
    if (sizeSel) {
      sizeSel.addEventListener('change', function () {
        var s = parseInt(sizeSel.value, 10);
        if (s === 16 || s === 32) {
          setGridSize(s);
        }
      });
    }

    // Undo / Redo / Clear / Export buttons
    var undoBtn = document.getElementById('paintUndoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);

    var redoBtn = document.getElementById('paintRedoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redo);

    var clearBtn = document.getElementById('paintClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (typeof root.confirm === 'function' && !root.confirm('Clear canvas drawing?')) {
          return;
        }
        clearCanvas();
      });
    }

    var exportBtn = document.getElementById('paintExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var dataUrl = exportPNG(16);
        if (dataUrl) {
          var a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'pip-pixel-art.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (PIP.toast) PIP.toast('Pixel artwork exported as PNG!');
        }
      });
    }

    // Canvas Mouse & Touch Drawing
    var isDrawing = false;

    function getCoords(e) {
      var rect = canvasEl.getBoundingClientRect();
      var clientX = e.clientX;
      var clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      var x = Math.floor(((clientX - rect.left) / rect.width) * state.size);
      var y = Math.floor(((clientY - rect.top) / rect.height) * state.size);
      return [x, y];
    }

    function applyAction(coords) {
      var x = coords[0];
      var y = coords[1];
      if (x < 0 || x >= state.size || y < 0 || y >= state.size) return;

      if (state.tool === 'pencil') {
        if (state.grid[y][x] !== state.color) {
          setPixel(x, y, state.color);
          renderCanvas();
        }
      } else if (state.tool === 'eraser') {
        if (state.grid[y][x] !== null) {
          setPixel(x, y, null);
          renderCanvas();
        }
      } else if (state.tool === 'bucket') {
        pushHistory();
        floodFill(state.grid, x, y, state.grid[y][x], state.color);
        pushHistory();
        renderCanvas();
      } else if (state.tool === 'picker') {
        var picked = getPixel(x, y);
        if (picked) {
          state.color = picked;
          state.tool = 'pencil';
          toolBtns.forEach(function (b) {
            var active = b.getAttribute('data-tool') === 'pencil';
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          if (paletteContainer) {
            paletteContainer.querySelectorAll('.paint-swatch').forEach(function (s) {
              s.classList.toggle('is-active', s.style.backgroundColor === picked);
            });
          }
        }
      }
    }

    if (canvasEl) {
      canvasEl.addEventListener('mousedown', function (e) {
        isDrawing = true;
        if (state.tool === 'pencil' || state.tool === 'eraser') {
          pushHistory();
        }
        applyAction(getCoords(e));
      });

      window.addEventListener('mouseup', function () {
        if (isDrawing && (state.tool === 'pencil' || state.tool === 'eraser')) {
          pushHistory();
        }
        isDrawing = false;
      });

      canvasEl.addEventListener('mousemove', function (e) {
        if (!isDrawing) return;
        if (state.tool === 'pencil' || state.tool === 'eraser') {
          applyAction(getCoords(e));
        }
      });

      // Touch events
      canvasEl.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isDrawing = true;
        if (state.tool === 'pencil' || state.tool === 'eraser') {
          pushHistory();
        }
        applyAction(getCoords(e));
      }, { passive: false });

      canvasEl.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (!isDrawing) return;
        if (state.tool === 'pencil' || state.tool === 'eraser') {
          applyAction(getCoords(e));
        }
      }, { passive: false });

      canvasEl.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (isDrawing && (state.tool === 'pencil' || state.tool === 'eraser')) {
          pushHistory();
        }
        isDrawing = false;
      }, { passive: false });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  var api = {
    PALETTE: PALETTE,
    createGrid: createGrid,
    cloneGrid: cloneGrid,
    floodFill: floodFill,
    setPixel: setPixel,
    getPixel: getPixel,
    clearCanvas: clearCanvas,
    setGridSize: setGridSize,
    undo: undo,
    redo: redo,
    pushHistory: pushHistory,
    exportPNG: exportPNG,
    getState: function () {
      return {
        size: state.size,
        color: state.color,
        tool: state.tool,
        grid: cloneGrid(state.grid)
      };
    },
    setTool: function (toolName) {
      if (['pencil', 'eraser', 'bucket', 'picker'].indexOf(toolName) !== -1) {
        state.tool = toolName;
        return true;
      }
      return false;
    },
    setColor: function (col) {
      state.color = col;
    }
  };

  PIP.paint = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
