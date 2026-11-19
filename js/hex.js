/* hex.js: Retro Hex Byte Inspector & Save Vault Viewer (pip-hex.exe)
   Inspects raw binary/string byte representations with 8-byte grouped hex values,
   printable ASCII decoders, CRC-32 checksums, and PipFS/LocalStorage inspection. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  var PIP = root.PIP || {};
  root.PIP = PIP;

  function stringToBytes(str) {
    if (typeof str !== 'string') return new Uint8Array(0);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str);
    }
    var b = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      b[i] = str.charCodeAt(i) & 0xff;
    }
    return b;
  }

  function padHex(num, len) {
    var s = num.toString(16).toUpperCase();
    while (s.length < len) s = '0' + s;
    return s;
  }

  function computeCrc32(bytes) {
    var crc = 0 ^ (-1);
    for (var i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  var CRC_TABLE = (function () {
    var c;
    var table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[n] = c;
    }
    return table;
  })();

  function toHexDump(inputData, bytesPerLine) {
    var bpl = bytesPerLine || 16;
    var bytes = (inputData instanceof Uint8Array) ? inputData : stringToBytes(String(inputData || ''));
    var lines = [];

    for (var offset = 0; offset < bytes.length; offset += bpl) {
      var chunk = bytes.slice(offset, offset + bpl);
      var offsetStr = padHex(offset, 8);

      var hex1 = [];
      var hex2 = [];
      var ascii = [];

      for (var i = 0; i < bpl; i++) {
        if (i < chunk.length) {
          var byteVal = chunk[i];
          var h = padHex(byteVal, 2);
          if (i < 8) hex1.push(h);
          else hex2.push(h);

          // Printable ASCII 32 to 126
          if (byteVal >= 32 && byteVal <= 126) {
            ascii.push(String.fromCharCode(byteVal));
          } else {
            ascii.push('·');
          }
        } else {
          if (i < 8) hex1.push('  ');
          else hex2.push('  ');
          ascii.push(' ');
        }
      }

      var hex1Str = hex1.join(' ');
      var hex2Str = hex2.join(' ');
      var asciiStr = ascii.join('');
      var fullRow = offsetStr + ': ' + hex1Str + '  ' + hex2Str + '  |' + asciiStr + '|';

      lines.push({
        offset: offsetStr,
        hex1: hex1Str,
        hex2: hex2Str,
        ascii: asciiStr,
        raw: fullRow
      });
    }

    return {
      byteLength: bytes.length,
      crc32: padHex(computeCrc32(bytes), 8),
      lines: lines,
      text: lines.map(function (l) { return l.raw; }).join('\n')
    };
  }

  var state = {
    targetType: 'text', // 'text', 'storage', 'file'
    targetName: '',
    rawInput: 'haX.baby :: pipOS Starlight Nursery Edition (October 2026)',
    currentDump: null
  };

  function getStorageKeys() {
    var keys = [];
    if (typeof root.localStorage !== 'undefined') {
      try {
        for (var i = 0; i < root.localStorage.length; i++) {
          var k = root.localStorage.key(i);
          if (k) keys.push(k);
        }
      } catch (e) {}
    }
    return keys;
  }

  function inspect(targetType, targetName, customText) {
    state.targetType = targetType;
    state.targetName = targetName || '';

    var content = '';
    if (targetType === 'storage') {
      if (typeof root.localStorage !== 'undefined') {
        content = root.localStorage.getItem(targetName) || '';
      }
    } else if (targetType === 'file') {
      var vfs = (PIP.fs) || (typeof require !== 'undefined' ? (function () { try { return require('./vfs.js'); } catch (e) {} })() : null);
      if (vfs) {
        try {
          content = vfs.readFile(targetName);
        } catch (e) {
          content = 'Error reading file: ' + (e.message || 'not found');
        }
      } else {
        content = 'Virtual File System not loaded';
      }
    } else {
      content = typeof customText === 'string' ? customText : state.rawInput;
      state.rawInput = content;
    }

    state.currentDump = toHexDump(content);
    return state.currentDump;
  }

  function initUI() {
    if (typeof document === 'undefined') return;
    var win = document.getElementById('hexWin');
    if (!win) return;

    var inputArea = document.getElementById('hexInput');
    var targetSelect = document.getElementById('hexTargetSelect');
    var renderBtn = document.getElementById('hexInspectBtn');
    var outputScreen = document.getElementById('hexScreen');
    var metaBytes = document.getElementById('hexMetaBytes');
    var metaCrc = document.getElementById('hexMetaCrc');
    var copyBtn = document.getElementById('hexCopyBtn');

    function populateTargets() {
      if (!targetSelect) return;
      targetSelect.innerHTML = '<option value="custom">✏️ Custom Text Input</option>';

      var keys = getStorageKeys();
      if (keys.length > 0) {
        var optGroup = document.createElement('optgroup');
        optGroup.label = 'Browser Storage Keys';
        keys.forEach(function (k) {
          var opt = document.createElement('option');
          opt.value = 'storage:' + k;
          opt.textContent = '💾 ' + k;
          optGroup.appendChild(opt);
        });
        targetSelect.appendChild(optGroup);
      }

      // Add PipFS files if available
      var optGroupFs = document.createElement('optgroup');
      optGroupFs.label = 'PipFS Virtual Files';
      ['/etc/os-release', '/home/pip/notes.txt'].forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = 'file:' + f;
        opt.textContent = '📄 ' + f;
        optGroupFs.appendChild(opt);
      });
      targetSelect.appendChild(optGroupFs);
    }

    function runInspection() {
      var val = targetSelect ? targetSelect.value : 'custom';
      var dump = null;

      if (val && val.startsWith('storage:')) {
        var key = val.substring('storage:'.length);
        dump = inspect('storage', key);
      } else if (val && val.startsWith('file:')) {
        var file = val.substring('file:'.length);
        dump = inspect('file', file);
      } else {
        var txt = inputArea ? inputArea.value : state.rawInput;
        dump = inspect('text', 'custom', txt);
      }

      if (outputScreen) {
        outputScreen.textContent = dump.text || '(empty payload)';
      }
      if (metaBytes) metaBytes.textContent = dump.byteLength + ' Bytes';
      if (metaCrc) metaCrc.textContent = 'CRC32: 0x' + dump.crc32;
    }

    populateTargets();

    if (targetSelect) {
      targetSelect.addEventListener('change', function () {
        var isCustom = targetSelect.value === 'custom';
        if (inputArea) {
          inputArea.style.display = isCustom ? 'block' : 'none';
        }
        runInspection();
      });
    }

    if (renderBtn) {
      renderBtn.addEventListener('click', runInspection);
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (state.currentDump && root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
          root.navigator.clipboard.writeText(state.currentDump.text).then(function () {
            if (PIP.toast) PIP.toast('Hex dump copied to clipboard!');
          });
        }
      });
    }

    runInspection();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  var api = {
    toHexDump: toHexDump,
    computeCrc32: computeCrc32,
    stringToBytes: stringToBytes,
    inspect: inspect,
    getState: function () {
      return {
        targetType: state.targetType,
        targetName: state.targetName,
        currentDump: state.currentDump
      };
    }
  };

  PIP.hex = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
