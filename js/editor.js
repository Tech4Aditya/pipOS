/**
 * PipOS Retro Text Editor (pip-pad.exe)
 * Pure vanilla ES6 text editor with word/char/line metrics, autosave, and .txt export.
 * Zero external dependencies. IEEE IGDTUW Open Source Week 10.0.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PipEditor = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'pip_editor_draft';

  function countWords(str) {
    if (!str || typeof str !== 'string') return 0;
    const tokens = str.trim().split(/\s+/);
    return tokens[0] === '' ? 0 : tokens.length;
  }

  function countChars(str) {
    if (!str || typeof str !== 'string') return 0;
    return str.length;
  }

  function countLines(str) {
    if (!str || typeof str !== 'string') return 1;
    return str.split('\n').length;
  }

  function saveDraft(text, storage = globalThis.localStorage) {
    if (!storage) return false;
    try {
      storage.setItem(STORAGE_KEY, text || '');
      return true;
    } catch {
      return false;
    }
  }

  function loadDraft(storage = globalThis.localStorage) {
    if (!storage) return '';
    try {
      return storage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  function exportTextFile(filename, content) {
    const safeName = (filename || 'note.txt').replace(/[^\w.-]/g, '_');
    if (typeof document === 'undefined') return safeName;
    const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName.endsWith('.txt') ? safeName : safeName + '.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
    return safeName;
  }

  function initEditor() {
    const editorWin = document.getElementById('editorWin');
    const textarea = document.getElementById('editorTextarea');
    const wordCountEl = document.getElementById('editorWordCount');
    const charCountEl = document.getElementById('editorCharCount');
    const lineCountEl = document.getElementById('editorLineCount');
    const exportBtn = document.getElementById('editorExportBtn');
    const clearBtn = document.getElementById('editorClearBtn');
    const newBtn = document.getElementById('editorNewBtn');
    const openBtn = document.getElementById('editorOpenBtn');
    const zoomInBtn = document.getElementById('editorZoomIn');
    const zoomOutBtn = document.getElementById('editorZoomOut');

    if (!textarea) return;

    let fontSize = 14;

    function updateStats() {
      const val = textarea.value;
      if (wordCountEl) wordCountEl.textContent = `${countWords(val)} words`;
      if (charCountEl) charCountEl.textContent = `${countChars(val)} chars`;
      if (lineCountEl) lineCountEl.textContent = `Line ${countLines(val)}`;
      saveDraft(val);
    }

    const saved = loadDraft();
    if (saved) {
      textarea.value = saved;
    }
    updateStats();

    textarea.addEventListener('input', updateStats);

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportTextFile('pip-note.txt', textarea.value);
        if (typeof window.showToast === 'function') {
          window.showToast('Note exported as pip-note.txt');
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear editor buffer?')) {
          textarea.value = '';
          updateStats();
        }
      });
    }

    if (newBtn) {
      newBtn.addEventListener('click', () => {
        textarea.value = '';
        updateStats();
        textarea.focus();
      });
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (fontSize < 24) {
          fontSize += 2;
          textarea.style.fontSize = `${fontSize}px`;
        }
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (fontSize > 10) {
          fontSize -= 2;
          textarea.style.fontSize = `${fontSize}px`;
        }
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEditor);
    } else {
      initEditor();
    }
  }

  return {
    countWords,
    countChars,
    countLines,
    saveDraft,
    loadDraft,
    exportTextFile,
    initEditor
  };
});
