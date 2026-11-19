/**
 * js/bridge.js
 * Host Drag-and-Drop File Import & Export Bridge (pip-drop-import / pip-bridge.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.bridge = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var IMPORT_DIR = '/home/pip/imports';
  var STORAGE_KEY = 'pipos_bridge_metadata';

  var state = {
    importedFiles: [],
    isDragging: false
  };

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  function getFS() {
    try {
      if (typeof window !== 'undefined' && window.PIP && window.PIP.fs) {
        return window.PIP.fs;
      }
      if (typeof globalThis !== 'undefined' && globalThis.PIP && globalThis.PIP.fs) {
        return globalThis.PIP.fs;
      }
    } catch (_) {}
    return null;
  }

  function load() {
    var store = getStorage();
    if (!store) return;
    try {
      var raw = store.getItem(STORAGE_KEY);
      if (raw) {
        state.importedFiles = JSON.parse(raw);
      }
    } catch (_) {
      state.importedFiles = [];
    }
  }

  function save() {
    var store = getStorage();
    if (!store) return;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state.importedFiles));
    } catch (_) {}
  }

  function importFile(filename, content, mimeType) {
    var cleanName = String(filename || 'imported_file.txt').replace(/[^a-zA-Z0-9._-]/g, '_');
    var size = typeof content === 'string' ? content.length : (content ? content.byteLength || 0 : 0);
    var type = mimeType || 'text/plain';

    // Write to virtual filesystem
    var fs = getFS();
    if (fs) {
      try {
        fs.mkdir(IMPORT_DIR);
      } catch (_) {}
      try {
        fs.writeFile(IMPORT_DIR + '/' + cleanName, String(content || ''));
      } catch (_) {}
    }

    var record = {
      name: cleanName,
      path: IMPORT_DIR + '/' + cleanName,
      size: size,
      type: type,
      importedAt: Date.now()
    };

    // Replace if existing
    state.importedFiles = state.importedFiles.filter(function (f) { return f.name !== cleanName; });
    state.importedFiles.unshift(record);
    save();

    return record;
  }

  function getImportedFiles() {
    return state.importedFiles.slice();
  }

  function removeImportedFile(filename) {
    var initialLen = state.importedFiles.length;
    state.importedFiles = state.importedFiles.filter(function (f) { return f.name !== filename; });

    var fs = getFS();
    if (fs) {
      try {
        fs.unlink(IMPORT_DIR + '/' + filename);
      } catch (_) {}
    }

    var removed = state.importedFiles.length < initialLen;
    if (removed) save();
    return removed;
  }

  function exportArchive() {
    var fs = getFS();
    var bundle = {
      exportedAt: new Date().toISOString(),
      source: 'PipOS Host Bridge',
      files: []
    };

    state.importedFiles.forEach(function (f) {
      var fileContent = '';
      if (fs) {
        try {
          fileContent = fs.readFile(f.path);
        } catch (_) {}
      }
      bundle.files.push({
        name: f.name,
        size: f.size,
        type: f.type,
        content: fileContent
      });
    });

    return JSON.stringify(bundle, null, 2);
  }

  function render(listContainer) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    var files = getImportedFiles();
    if (files.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'bridge-empty';
      empty.textContent = 'No host files imported yet. Drag and drop any file here or into PipOS!';
      listContainer.appendChild(empty);
      return;
    }

    files.forEach(function (f) {
      var item = document.createElement('div');
      item.className = 'bridge-item';

      var icon = document.createElement('span');
      icon.className = 'bridge-item-icon';
      icon.textContent = f.name.endsWith('.md') || f.name.endsWith('.txt') ? '📄' : (f.name.endsWith('.json') ? '📦' : '📁');

      var meta = document.createElement('div');
      meta.className = 'bridge-item-meta';

      var name = document.createElement('div');
      name.className = 'bridge-item-name';
      name.textContent = f.name;

      var info = document.createElement('div');
      info.className = 'bridge-item-info';
      var kb = (f.size / 1024).toFixed(1);
      info.textContent = kb + ' KB • Path: ' + f.path;

      meta.appendChild(name);
      meta.appendChild(info);

      var actions = document.createElement('div');
      actions.className = 'bridge-item-actions';

      var dlBtn = document.createElement('button');
      dlBtn.type = 'button';
      dlBtn.className = 'btn btn-tiny';
      dlBtn.textContent = '💾';
      dlBtn.title = 'Download / Export file';
      dlBtn.addEventListener('click', function () {
        var fs = getFS();
        var content = '';
        if (fs) {
          try { content = fs.readFile(f.path); } catch (_) {}
        }
        var blob = new Blob([content], { type: f.type });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-tiny';
      delBtn.textContent = '🗑️';
      delBtn.title = 'Remove file';
      delBtn.addEventListener('click', function () {
        removeImportedFile(f.name);
        render(listContainer);
      });

      actions.appendChild(dlBtn);
      actions.appendChild(delBtn);

      item.appendChild(icon);
      item.appendChild(meta);
      item.appendChild(actions);
      listContainer.appendChild(item);
    });
  }

  function bindDragAndDrop(overlayEl, listEl) {
    if (typeof window === 'undefined') return;

    var dragCounter = 0;

    window.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragCounter++;
      if (overlayEl) {
        overlayEl.classList.remove('is-hidden');
        overlayEl.removeAttribute('inert');
      }
    });

    window.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    window.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (overlayEl) {
          overlayEl.classList.add('is-hidden');
          overlayEl.setAttribute('inert', '');
        }
      }
    });

    window.addEventListener('drop', function (e) {
      e.preventDefault();
      dragCounter = 0;
      if (overlayEl) {
        overlayEl.classList.add('is-hidden');
        overlayEl.setAttribute('inert', '');
      }

      var dt = e.dataTransfer;
      if (!dt || !dt.files || dt.files.length === 0) return;

      var files = Array.prototype.slice.call(dt.files);
      var count = 0;

      files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (evt) {
          importFile(file.name, evt.target.result, file.type);
          count++;
          if (count === files.length) {
            if (listEl) render(listEl);
            if (typeof PIP !== 'undefined' && PIP.toast) {
              PIP.toast('✨ Imported ' + files.length + ' file(s) into /home/pip/imports/');
            }
          }
        };
        reader.readAsText(file);
      });
    });
  }

  function init() {
    load();

    var listEl = document.getElementById('bridgeList');
    var overlayEl = document.getElementById('dropOverlay');
    var fileInput = document.getElementById('bridgeFileInput');
    var exportAllBtn = document.getElementById('bridgeExportAllBtn');

    if (listEl) render(listEl);

    bindDragAndDrop(overlayEl, listEl);

    if (fileInput && listEl) {
      fileInput.addEventListener('change', function () {
        if (!fileInput.files) return;
        var files = Array.prototype.slice.call(fileInput.files);
        files.forEach(function (file) {
          var reader = new FileReader();
          reader.onload = function (evt) {
            importFile(file.name, evt.target.result, file.type);
            render(listEl);
          };
          reader.readAsText(file);
        });
      });
    }

    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function () {
        var archiveStr = exportArchive();
        var blob = new Blob([archiveStr], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pipos_imported_archive.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
  }

  // Pre-load state
  load();

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    importFile: importFile,
    getImportedFiles: getImportedFiles,
    removeImportedFile: removeImportedFile,
    exportArchive: exportArchive,
    load: load,
    save: save,
    render: render,
    init: init
  };
});
