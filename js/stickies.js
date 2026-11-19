/**
 * js/stickies.js
 * Retro Desktop Sticky Notes & Multi-Clipboard History (pip-stickies.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.stickies = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'pipos_stickies';
  var CLIPBOARD_KEY = 'pipos_clipboard_history';
  var MAX_CLIPBOARD = 15;

  var PALETTES = {
    lemon: { name: 'Lemon', bg: '#fef08a', text: '#713f12' },
    mint: { name: 'Mint', bg: '#bbf7d0', text: '#14532d' },
    lavender: { name: 'Lavender', bg: '#e9d5ff', text: '#581c87' },
    rose: { name: 'Rose', bg: '#fecdd3', text: '#881337' },
    sky: { name: 'Sky', bg: '#bae6fd', text: '#0c4a6e' }
  };

  var state = {
    notes: [],
    clipboard: [],
    searchQuery: '',
    selectedColor: 'lemon'
  };

  function generateId() {
    return 'sticky_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  function load() {
    var store = getStorage();
    if (!store) {
      if (state.notes.length === 0) seedDefaultNotes();
      return;
    }

    try {
      var rawNotes = store.getItem(STORAGE_KEY);
      if (rawNotes) {
        state.notes = JSON.parse(rawNotes);
      } else {
        seedDefaultNotes();
      }
    } catch (_) {
      seedDefaultNotes();
    }

    try {
      var rawClip = store.getItem(CLIPBOARD_KEY);
      if (rawClip) {
        state.clipboard = JSON.parse(rawClip);
      }
    } catch (_) {
      state.clipboard = [];
    }
  }

  function save() {
    var store = getStorage();
    if (!store) return;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      store.setItem(CLIPBOARD_KEY, JSON.stringify(state.clipboard));
    } catch (_) {}
  }

  function seedDefaultNotes() {
    state.notes = [
      {
        id: 'sticky_seed_1',
        title: '🌟 Pip Starlight Mission',
        content: 'Remember to water the moonflowers and check constellation coordinates before bedtime!',
        color: 'lemon',
        pinned: true,
        updatedAt: Date.now() - 3600000
      },
      {
        id: 'sticky_seed_2',
        title: '🎵 Lullaby Secret Code',
        content: 'Pentatonic chord progression: C4 -> E4 -> G4 -> A4 -> C5.',
        color: 'lavender',
        pinned: false,
        updatedAt: Date.now() - 7200000
      }
    ];
  }

  function createNote(title, content, color, pinned) {
    var note = {
      id: generateId(),
      title: (title || 'New Scratchpad').trim(),
      content: (content || '').trim(),
      color: PALETTES[color] ? color : 'lemon',
      pinned: Boolean(pinned),
      updatedAt: Date.now()
    };
    state.notes.unshift(note);
    save();
    return note;
  }

  function updateNote(id, patch) {
    for (var i = 0; i < state.notes.length; i++) {
      if (state.notes[i].id === id) {
        if (typeof patch.title === 'string') state.notes[i].title = patch.title.trim();
        if (typeof patch.content === 'string') state.notes[i].content = patch.content;
        if (patch.color && PALETTES[patch.color]) state.notes[i].color = patch.color;
        if (typeof patch.pinned === 'boolean') state.notes[i].pinned = patch.pinned;
        state.notes[i].updatedAt = Date.now();
        save();
        return state.notes[i];
      }
    }
    return null;
  }

  function deleteNote(id) {
    var initialLen = state.notes.length;
    state.notes = state.notes.filter(function (n) { return n.id !== id; });
    var removed = state.notes.length < initialLen;
    if (removed) save();
    return removed;
  }

  function getNotes(filterText) {
    var query = (filterText || state.searchQuery || '').trim().toLowerCase();
    var list = state.notes.slice();

    // Sort pinned first, then newest updated
    list.sort(function (a, b) {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (!query) return list;

    return list.filter(function (n) {
      return (
        (n.title && n.title.toLowerCase().indexOf(query) !== -1) ||
        (n.content && n.content.toLowerCase().indexOf(query) !== -1)
      );
    });
  }

  function pushClipboard(text) {
    if (!text || typeof text !== 'string') return state.clipboard;
    var trimmed = text.trim();
    if (!trimmed) return state.clipboard;

    // Deduplicate immediate top
    if (state.clipboard.length > 0 && state.clipboard[0] === trimmed) {
      return state.clipboard;
    }

    // Remove if already in history so it moves to front
    state.clipboard = state.clipboard.filter(function (item) { return item !== trimmed; });
    state.clipboard.unshift(trimmed);

    if (state.clipboard.length > MAX_CLIPBOARD) {
      state.clipboard = state.clipboard.slice(0, MAX_CLIPBOARD);
    }

    save();
    return state.clipboard;
  }

  function getClipboardHistory() {
    return state.clipboard.slice();
  }

  function clearClipboard() {
    state.clipboard = [];
    save();
  }

  function render(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    var filtered = getNotes();
    if (filtered.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'sticky-empty';
      empty.textContent = 'No sticky notes found. Create your first scratchpad above!';
      containerEl.appendChild(empty);
      return;
    }

    filtered.forEach(function (n) {
      var card = document.createElement('article');
      card.className = 'sticky-card sticky-color-' + n.color + (n.pinned ? ' is-pinned' : '');
      card.setAttribute('data-id', n.id);

      var head = document.createElement('div');
      head.className = 'sticky-card-head';

      var titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'sticky-card-title';
      titleInput.value = n.title;
      titleInput.setAttribute('aria-label', 'Note title');
      titleInput.addEventListener('change', function () {
        updateNote(n.id, { title: titleInput.value });
      });

      var actions = document.createElement('div');
      actions.className = 'sticky-card-actions';

      var pinBtn = document.createElement('button');
      pinBtn.type = 'button';
      pinBtn.className = 'btn-icon-tiny sticky-pin-btn';
      pinBtn.title = n.pinned ? 'Unpin note' : 'Pin note to top';
      pinBtn.setAttribute('aria-label', pinBtn.title);
      pinBtn.textContent = n.pinned ? '📌' : '📍';
      pinBtn.addEventListener('click', function () {
        updateNote(n.id, { pinned: !n.pinned });
        render(containerEl);
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-tiny sticky-del-btn';
      delBtn.title = 'Delete note';
      delBtn.setAttribute('aria-label', 'Delete note');
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function () {
        deleteNote(n.id);
        render(containerEl);
      });

      actions.appendChild(pinBtn);
      actions.appendChild(delBtn);
      head.appendChild(titleInput);
      head.appendChild(actions);

      var bodyText = document.createElement('textarea');
      bodyText.className = 'sticky-card-content';
      bodyText.value = n.content;
      bodyText.setAttribute('aria-label', 'Note content');
      bodyText.rows = 4;
      bodyText.addEventListener('input', function () {
        updateNote(n.id, { content: bodyText.value });
      });

      var foot = document.createElement('div');
      foot.className = 'sticky-card-foot';

      // Palette selector
      var paletteWrap = document.createElement('div');
      paletteWrap.className = 'sticky-palettes';
      Object.keys(PALETTES).forEach(function (colorKey) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'sticky-palette-dot dot-' + colorKey + (n.color === colorKey ? ' active' : '');
        dot.title = PALETTES[colorKey].name;
        dot.setAttribute('aria-label', PALETTES[colorKey].name + ' color');
        dot.addEventListener('click', function () {
          updateNote(n.id, { color: colorKey });
          render(containerEl);
        });
        paletteWrap.appendChild(dot);
      });

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-tiny';
      copyBtn.textContent = '📋 Copy';
      copyBtn.addEventListener('click', function () {
        var text = (n.title ? n.title + '\n' : '') + (n.content || '');
        pushClipboard(text);
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(function () {});
        }
        renderClipboard(document.getElementById('stickiesClipList'));
        if (typeof PIP !== 'undefined' && PIP.toast) {
          PIP.toast('Note copied to clipboard!');
        }
      });

      foot.appendChild(paletteWrap);
      foot.appendChild(copyBtn);

      card.appendChild(head);
      card.appendChild(bodyText);
      card.appendChild(foot);
      containerEl.appendChild(card);
    });
  }

  function renderClipboard(clipContainer) {
    if (!clipContainer) return;
    clipContainer.innerHTML = '';

    var history = getClipboardHistory();
    if (history.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'clip-empty';
      empty.textContent = 'Clipboard history is empty. Copied text snippets will appear here.';
      clipContainer.appendChild(empty);
      return;
    }

    history.forEach(function (item, idx) {
      var li = document.createElement('li');
      li.className = 'clip-item';

      var preview = document.createElement('span');
      preview.className = 'clip-text';
      preview.textContent = item.length > 60 ? item.slice(0, 60) + '…' : item;

      var useBtn = document.createElement('button');
      useBtn.type = 'button';
      useBtn.className = 'btn btn-tiny';
      useBtn.textContent = '➕ Note';
      useBtn.title = 'Create sticky note from this snippet';
      useBtn.addEventListener('click', function () {
        createNote('Snippet #' + (idx + 1), item, 'lemon', false);
        render(document.getElementById('stickiesList'));
      });

      li.appendChild(preview);
      li.appendChild(useBtn);
      clipContainer.appendChild(li);
    });
  }

  function init() {
    load();

    var listEl = document.getElementById('stickiesList');
    var clipEl = document.getElementById('stickiesClipList');
    var addBtn = document.getElementById('stickiesAddBtn');
    var searchEl = document.getElementById('stickiesSearch');
    var clearClipBtn = document.getElementById('stickiesClearClipBtn');

    if (listEl) render(listEl);
    if (clipEl) renderClipboard(clipEl);

    if (addBtn && listEl) {
      addBtn.addEventListener('click', function () {
        createNote('New Scratchpad', '', state.selectedColor, false);
        render(listEl);
      });
    }

    if (searchEl && listEl) {
      searchEl.addEventListener('input', function () {
        state.searchQuery = searchEl.value;
        render(listEl);
      });
    }

    if (clearClipBtn && clipEl) {
      clearClipBtn.addEventListener('click', function () {
        clearClipboard();
        renderClipboard(clipEl);
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    PALETTES: PALETTES,
    createNote: createNote,
    updateNote: updateNote,
    deleteNote: deleteNote,
    getNotes: getNotes,
    pushClipboard: pushClipboard,
    getClipboardHistory: getClipboardHistory,
    clearClipboard: clearClipboard,
    save: save,
    load: load,
    render: render,
    renderClipboard: renderClipboard,
    init: init
  };
});
