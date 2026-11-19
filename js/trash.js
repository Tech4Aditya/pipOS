/* trash.js: Desktop Trash Can and Soft File Deletion System for PipOS.
   Maintains soft-deleted files with metadata and restore capability. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var trashItems = [];

  function getStore() {
    return PIP.store || {
      get: function (k, def) { return def; },
      set: function () {}
    };
  }

  function loadTrash() {
    try {
      var saved = getStore().get('pip_trash_items', []);
      if (Array.isArray(saved)) {
        trashItems = saved;
      }
    } catch (e) {
      trashItems = [];
    }
    return trashItems;
  }

  function saveTrash() {
    try {
      getStore().set('pip_trash_items', trashItems);
    } catch (e) {}
  }

  function generateId() {
    return 'trash_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  function moveToTrash(path, content, meta) {
    if (!path || typeof path !== 'string') {
      throw new Error('Valid file path required to move to trash');
    }

    var fileContent = content;
    if (fileContent === undefined && PIP.vfs && typeof PIP.vfs.readFile === 'function') {
      try {
        fileContent = PIP.vfs.readFile(path);
        if (typeof PIP.vfs.unlink === 'function') {
          PIP.vfs.unlink(path);
        }
      } catch (e) {
        fileContent = '';
      }
    }

    var item = {
      id: generateId(),
      originalPath: path,
      name: path.split('/').filter(Boolean).pop() || 'untitled',
      content: fileContent !== undefined ? fileContent : '',
      deletedAt: Date.now(),
      size: typeof fileContent === 'string' ? fileContent.length : 0,
      meta: meta || {}
    };

    trashItems.unshift(item);
    saveTrash();
    updateUI();

    if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
      try {
        var ev = new CustomEvent('pip-trash-change', { detail: { action: 'move', item: item } });
        document.dispatchEvent(ev);
      } catch (err) {}
    }

    return item;
  }

  function restore(id) {
    var idx = -1;
    for (var i = 0; i < trashItems.length; i++) {
      if (trashItems[i].id === id) {
        idx = i;
        break;
      }
    }

    if (idx === -1) {
      throw new Error('Item not found in trash: ' + id);
    }

    var item = trashItems[idx];
    if (PIP.vfs && typeof PIP.vfs.writeFile === 'function') {
      try {
        PIP.vfs.writeFile(item.originalPath, item.content);
      } catch (e) {
        // If directory doesn't exist, try creating parent dir
        if (typeof PIP.vfs.mkdir === 'function') {
          var parts = item.originalPath.split('/');
          parts.pop();
          var dir = parts.join('/') || '/';
          try {
            PIP.vfs.mkdir(dir);
            PIP.vfs.writeFile(item.originalPath, item.content);
          } catch (err) {}
        }
      }
    }

    trashItems.splice(idx, 1);
    saveTrash();
    updateUI();

    if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
      try {
        var ev = new CustomEvent('pip-trash-restore', { detail: { item: item } });
        document.dispatchEvent(ev);
      } catch (err) {}
    }

    return item;
  }

  function emptyTrash() {
    var count = trashItems.length;
    trashItems = [];
    saveTrash();
    updateUI();

    if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
      try {
        var ev = new CustomEvent('pip-trash-empty', { detail: { count: count } });
        document.dispatchEvent(ev);
      } catch (err) {}
    }

    return count;
  }

  function listTrash() {
    return trashItems.slice();
  }

  function getItem(id) {
    for (var i = 0; i < trashItems.length; i++) {
      if (trashItems[i].id === id) {
        return trashItems[i];
      }
    }
    return null;
  }

  function updateUI() {
    if (typeof document === 'undefined') return;

    // Update trash desktop icon status
    var trashIcon = document.getElementById('trashIcon');
    if (trashIcon) {
      if (trashItems.length > 0) {
        trashIcon.classList.add('has-items');
        trashIcon.setAttribute('aria-label', 'Trash Can (' + trashItems.length + ' items)');
      } else {
        trashIcon.classList.remove('has-items');
        trashIcon.setAttribute('aria-label', 'Trash Can (Empty)');
      }
    }

    // Update trash window items list
    var listEl = document.getElementById('trashList');
    var emptyMsg = document.getElementById('trashEmptyMsg');
    var emptyBtn = document.getElementById('trashEmptyBtn');

    if (emptyBtn) {
      emptyBtn.disabled = trashItems.length === 0;
    }

    if (listEl) {
      listEl.innerHTML = '';
      if (trashItems.length === 0) {
        if (emptyMsg) emptyMsg.hidden = false;
      } else {
        if (emptyMsg) emptyMsg.hidden = true;
        trashItems.forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'trash-item-row';
          row.setAttribute('data-id', item.id);

          var info = document.createElement('div');
          info.className = 'trash-item-info';

          var nameSpan = document.createElement('strong');
          nameSpan.className = 'trash-item-name';
          nameSpan.textContent = item.name;

          var pathSpan = document.createElement('span');
          pathSpan.className = 'trash-item-path';
          pathSpan.textContent = item.originalPath + ' (' + item.size + ' B)';

          info.appendChild(nameSpan);
          info.appendChild(pathSpan);

          var restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.className = 'btn btn-sm btn-ghost trash-restore-btn';
          restoreBtn.textContent = 'Put Back';
          restoreBtn.setAttribute('aria-label', 'Restore ' + item.name);
          restoreBtn.addEventListener('click', function () {
            restore(item.id);
            if (typeof PIP.toast === 'function') {
              PIP.toast('Restored ' + item.name);
            }
          });

          row.appendChild(info);
          row.appendChild(restoreBtn);
          listEl.appendChild(row);
        });
      }
    }
  }

  function init() {
    loadTrash();
    if (typeof document === 'undefined') return;

    var emptyBtn = document.getElementById('trashEmptyBtn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', function () {
        if (trashItems.length === 0) return;
        var count = emptyTrash();
        if (typeof PIP.toast === 'function') {
          PIP.toast('Trash emptied (' + count + ' items removed)');
        }
      });
    }

    updateUI();
  }

  var PipTrash = {
    init: init,
    moveToTrash: moveToTrash,
    restore: restore,
    emptyTrash: emptyTrash,
    listTrash: listTrash,
    getItem: getItem,
    loadTrash: loadTrash,
    updateUI: updateUI
  };

  PIP.trash = PipTrash;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipTrash;
  }
})();
