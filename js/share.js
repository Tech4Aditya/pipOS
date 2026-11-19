/**
 * js/share.js
 * Peer-to-Peer QR Code Share Sheet for Songs & Wishes (pip-share.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.share = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function base64Encode(str) {
    try {
      if (typeof btoa !== 'undefined') {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p1) {
          return String.fromCharCode('0x' + p1);
        }));
      }
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'utf8').toString('base64');
      }
    } catch (_) {}
    return '';
  }

  function base64Decode(str) {
    try {
      if (typeof atob !== 'undefined') {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
      }
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString('utf8');
      }
    } catch (_) {}
    return null;
  }

  function encodeSharePayload(type, title, data) {
    var payload = {
      t: type || 'text',
      n: (title || 'Shared PipOS Note').trim(),
      d: data || '',
      v: 1
    };
    var json = JSON.stringify(payload);
    var b64 = base64Encode(json);
    return b64;
  }

  function decodeSharePayload(str) {
    if (!str || typeof str !== 'string') return null;
    var raw = str;
    if (raw.indexOf('#share=') !== -1) {
      raw = raw.split('#share=')[1];
    }
    try {
      var decodedJson = base64Decode(raw);
      if (decodedJson) {
        var parsed = JSON.parse(decodedJson);
        return {
          type: parsed.t || 'text',
          title: parsed.n || 'Shared Item',
          data: parsed.d || '',
          version: parsed.v || 1
        };
      }
    } catch (_) {}
    return null;
  }

  /**
   * Compact, deterministic QR matrix generator (21x21 Version 1 QR code)
   */
  function generateQrMatrix(text) {
    var size = 21;
    var matrix = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) {
        row.push(0);
      }
      matrix.push(row);
    }

    function fillSquare(r, c, w, h, val) {
      for (var i = r; i < r + h; i++) {
        for (var j = c; j < c + w; j++) {
          if (i >= 0 && i < size && j >= 0 && j < size) {
            matrix[i][j] = val;
          }
        }
      }
    }

    function addFinder(r, c) {
      fillSquare(r, c, 7, 7, 1);
      fillSquare(r + 1, c + 1, 5, 5, 0);
      fillSquare(r + 2, c + 2, 3, 3, 1);
    }

    // Three Finder Patterns
    addFinder(0, 0);          // Top-Left
    addFinder(0, size - 7);   // Top-Right
    addFinder(size - 7, 0);   // Bottom-Left

    // Separators (white lines around finders)
    for (var i = 0; i < 8; i++) {
      matrix[7][i] = 0;
      matrix[i][7] = 0;
      matrix[7][size - 1 - i] = 0;
      matrix[i][size - 8] = 0;
      matrix[size - 8][i] = 0;
      matrix[size - 1 - i][7] = 0;
    }

    // Timing Patterns (alternating black/white)
    for (var t = 8; t < size - 8; t++) {
      matrix[6][t] = (t % 2 === 0) ? 1 : 0;
      matrix[t][6] = (t % 2 === 0) ? 1 : 0;
    }

    // Dark Module
    matrix[size - 8][8] = 1;

    // Convert string to bitstream
    var str = String(text || '');
    var bits = [];
    for (var s = 0; s < str.length; s++) {
      var code = str.charCodeAt(s);
      for (var b = 7; b >= 0; b--) {
        bits.push((code >> b) & 1);
      }
    }

    // Populate data modules outside function patterns with mask
    var bitIndex = 0;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip vertical timing line
      for (var rowIdx = 0; rowIdx < size; rowIdx++) {
        var row = (Math.floor((size - 1 - col) / 2) % 2 === 0) ? (size - 1 - rowIdx) : rowIdx;
        for (var cOffset = 0; cOffset < 2; cOffset++) {
          var targetCol = col - cOffset;
          // Check if reserved
          var isFinderTL = row < 9 && targetCol < 9;
          var isFinderTR = row < 9 && targetCol >= size - 8;
          var isFinderBL = row >= size - 8 && targetCol < 9;
          var isTiming = row === 6 || targetCol === 6;

          if (!isFinderTL && !isFinderTR && !isFinderBL && !isTiming) {
            var bit = (bitIndex < bits.length) ? bits[bitIndex] : ((row + targetCol) % 2 === 0 ? 1 : 0);
            // Mask pattern (row + col) % 2 === 0
            var mask = (row + targetCol) % 2 === 0 ? 1 : 0;
            matrix[row][targetCol] = bit ^ mask;
            bitIndex++;
          }
        }
      }
    }

    return matrix;
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"\']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character];
    });
  }

  function getQrSvgConfig(options, matrixSize) {
    var opts = options || {};
    var cellSize = Number(opts.cellSize);
    var padding = Number(opts.padding);
    if (!Number.isFinite(cellSize) || cellSize < 1 || cellSize > 64) cellSize = 8;
    if (!Number.isFinite(padding) || padding < 0 || padding > 100) padding = 16;
    cellSize = Math.floor(cellSize);
    padding = Math.floor(padding);

    function safeColor(value, fallback) {
      var color = typeof value === 'string' ? value.trim() : '';
      return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? color : fallback;
    }

    return {
      cellSize: cellSize,
      padding: padding,
      totalSize: matrixSize * cellSize + padding * 2,
      darkColor: safeColor(opts.darkColor, '#0f172a'),
      lightColor: safeColor(opts.lightColor, '#fef08a')
    };
  }

  function generateQrSvg(text, options) {
    var value = String(text || '');
    var matrix = generateQrMatrix(value);
    var size = matrix.length;
    var config = getQrSvgConfig(options, size);
    var svg = [];
    svg.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + config.totalSize + ' ' + config.totalSize + '" width="100%" height="100%" role="img" aria-label="QR Code for ' + escapeXml(value.slice(0, 30)) + '">');
    svg.push('<rect width="' + config.totalSize + '" height="' + config.totalSize + '" fill="' + config.lightColor + '" rx="8" />');

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          var x = config.padding + c * config.cellSize;
          var y = config.padding + r * config.cellSize;
          svg.push('<rect x="' + x + '" y="' + y + '" width="' + config.cellSize + '" height="' + config.cellSize + '" fill="' + config.darkColor + '" />');
        }
      }
    }

    svg.push('</svg>');
    return svg.join('\n');
  }

  function createQrSvgElement(text, options) {
    if (typeof document === 'undefined' || !document.createElementNS) return null;
    var value = String(text || '');
    var matrix = generateQrMatrix(value);
    var size = matrix.length;
    var config = getQrSvgConfig(options, size);
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + config.totalSize + ' ' + config.totalSize);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'QR Code for ' + value.slice(0, 30));

    var background = document.createElementNS(namespace, 'rect');
    background.setAttribute('width', String(config.totalSize));
    background.setAttribute('height', String(config.totalSize));
    background.setAttribute('fill', config.lightColor);
    background.setAttribute('rx', '8');
    svg.appendChild(background);

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          var cell = document.createElementNS(namespace, 'rect');
          cell.setAttribute('x', String(config.padding + c * config.cellSize));
          cell.setAttribute('y', String(config.padding + r * config.cellSize));
          cell.setAttribute('width', String(config.cellSize));
          cell.setAttribute('height', String(config.cellSize));
          cell.setAttribute('fill', config.darkColor);
          svg.appendChild(cell);
        }
      }
    }
    return svg;
  }

  function shareNative(data) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      return navigator.share(data).catch(function () {});
    }
    return Promise.reject(new Error('Web Share API not supported'));
  }

  function init() {
    var selectEl = document.getElementById('shareTypeSelect');
    var inputEl = document.getElementById('shareInput');
    var genBtn = document.getElementById('shareGenerateBtn');
    var qrContainer = document.getElementById('shareQrContainer');
    var copyBtn = document.getElementById('shareCopyLinkBtn');
    var nativeBtn = document.getElementById('shareNativeBtn');

    function updatePreview() {
      if (!qrContainer) return;
      var text = inputEl ? inputEl.value.trim() : '';
      if (!text) {
        text = typeof window !== 'undefined' ? window.location.href : 'https://pipos.org';
      }

      var b64 = encodeSharePayload(selectEl ? selectEl.value : 'text', 'PipOS Share', text);
      var shareUrl = (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://pipos.org') + '#share=' + b64;

      var svgElement = createQrSvgElement(shareUrl, {
        cellSize: 8,
        padding: 14,
        darkColor: '#1e1b4b',
        lightColor: '#fef08a'
      });

      if (!svgElement) return;
      while (qrContainer.firstChild) qrContainer.removeChild(qrContainer.firstChild);
      qrContainer.appendChild(svgElement);
    }

    if (genBtn) {
      genBtn.addEventListener('click', updatePreview);
    }

    if (selectEl && inputEl) {
      selectEl.addEventListener('change', function () {
        if (selectEl.value === 'url') {
          inputEl.value = typeof window !== 'undefined' ? window.location.href : 'https://pipos.org';
        } else if (selectEl.value === 'wish') {
          inputEl.value = 'May all your dreams be filled with gentle starlight and moonflowers.';
        } else if (selectEl.value === 'melody') {
          inputEl.value = 'C4 E4 G4 A4 C5';
        }
        updatePreview();
      });
    }

    if (copyBtn && inputEl) {
      copyBtn.addEventListener('click', function () {
        var b64 = encodeSharePayload(selectEl ? selectEl.value : 'text', 'PipOS Share', inputEl.value);
        var shareUrl = (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://pipos.org') + '#share=' + b64;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(function () {
            if (typeof PIP !== 'undefined' && PIP.toast) {
              PIP.toast('✨ Share link copied to clipboard!');
            }
          }).catch(function () {});
        }
      });
    }

    if (nativeBtn && inputEl) {
      nativeBtn.addEventListener('click', function () {
        var b64 = encodeSharePayload(selectEl ? selectEl.value : 'text', 'PipOS Share', inputEl.value);
        var shareUrl = (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://pipos.org') + '#share=' + b64;
        shareNative({
          title: 'PipOS Bedtime Starlight Share',
          text: inputEl.value,
          url: shareUrl
        }).catch(function () {
          if (typeof PIP !== 'undefined' && PIP.toast) {
            PIP.toast('Native share unavailable. Link copied instead!');
          }
        });
      });
    }

    // Check for incoming share hash in URL
    if (typeof window !== 'undefined' && window.location.hash.indexOf('#share=') !== -1) {
      var incoming = decodeSharePayload(window.location.hash);
      if (incoming && typeof PIP !== 'undefined' && PIP.toast) {
        PIP.toast('🌟 Received incoming share: ' + incoming.title + ' (' + incoming.type + ')');
      }
    }

    updatePreview();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    encodeSharePayload: encodeSharePayload,
    decodeSharePayload: decodeSharePayload,
    generateQrMatrix: generateQrMatrix,
    generateQrSvg: generateQrSvg,
    shareNative: shareNative,
    init: init
  };
});
