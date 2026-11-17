/* notes.js: Pip's Dream Notes & Journal (pip-pad.exe)
   A lightweight, zero-dependency Markdown notepad with live preview,
   secure HTML sanitization, word counting, dream templates, and local storage export. */
(function () {
  'use strict';

  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var toast = PIP.toast || function () {};
  var audio = PIP.audio || { isOn: function () { return false; }, note: function () {}, pop: function () {}, SCALE: [523, 659, 784] };

  var STORAGE_KEY = 'pip_dream_notes';

  var DEFAULT_NOTE = "# Pip's Midnight Dream Log 🌙\n\nWelcome to **pip-pad.exe**! This is your nursery journal.\n\n### Tonight's Checklist\n- [x] Wind the music box\n- [x] Check the darkroom attic for lost dreams\n- [ ] Count 100 stars on the nursery ceiling\n- [ ] Whisper a wish to the dream delivery cloud\n\n> *\"The best dreams are the ones you write down before morning.\"*\n\n```text\nDream Coordinates: Sector 7, Cloud 9\nLullaby Frequency: 523.25 Hz\n```\n";

  var TEMPLATES = {
    journal: "# Midnight Dream Log 🌙\n\n**Date:** Tonight\n**Moon Phase:** Waxing Crescent\n\n### What I Saw\n- Floating silver teapot above the garden\n- A lantern that sang in C pentatonic\n\n> *Sleep is just an adventure in pajamas.*\n",
    recipe: "# Starlight Tea Recipe 🍵\n\n### Ingredients\n- 2 cups of chamomile cloud milk\n- 1 pinch of powdered star sugar\n- 3 drops of warm moon honey\n- 1 drop of cinnamon essence\n\n### Directions\n1. Simmer gently until glowing faint amber.\n2. Stir counter-clockwise while humming a lullaby.\n3. Sip right before bedtime.\n",
    checklist: "# Nursery Nightly Checklist ⭐\n\n- [ ] Sweep nightmare dust from under the bed\n- [ ] Polish the dream lantern lenses\n- [ ] Stack rattle blocks into a sleepy tower\n- [ ] Set alarm to sunrise\n- [ ] Say goodnight to Pip\n"
  };

  function sanitizeHtml(str) {
    if (!str) return '';
    return str
      .replace(/on\w+\s*=/gi, 'data-blocked=')
      .replace(/(?:javascript|data|vbscript):/gi, 'blocked:')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Lightweight, zero-dependency Markdown to safe HTML renderer
  function parseMarkdown(md) {
    if (!md) return '';
    var rawLines = md.split(/\r?\n/);
    var html = [];
    var inCodeBlock = false;
    var inList = false;

    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i];

      // Code blocks
      if (/^```/.test(line)) {
        if (inCodeBlock) {
          html.push('</code></pre>');
          inCodeBlock = false;
        } else {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push('<pre><code>');
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        html.push(sanitizeHtml(line) + '\n');
        continue;
      }

      // Checklists & Bullet lists
      var checkMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (checkMatch) {
        if (!inList) { html.push('<ul class="md-checklist">'); inList = true; }
        var isChecked = checkMatch[1].toLowerCase() === 'x';
        html.push('<li class="md-check-item"><input type="checkbox" disabled ' + (isChecked ? 'checked' : '') + '> ' + formatInline(checkMatch[2]) + '</li>');
        continue;
      }

      var listMatch = line.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        if (!inList) { html.push('<ul>'); inList = true; }
        html.push('<li>' + formatInline(listMatch[1]) + '</li>');
        continue;
      }

      if (inList) {
        html.push('</ul>');
        inList = false;
      }

      // Headings
      if (/^### (.*$)/.test(line)) {
        html.push('<h3>' + formatInline(line.replace(/^### /, '')) + '</h3>');
      } else if (/^## (.*$)/.test(line)) {
        html.push('<h2>' + formatInline(line.replace(/^## /, '')) + '</h2>');
      } else if (/^# (.*$)/.test(line)) {
        html.push('<h1>' + formatInline(line.replace(/^# /, '')) + '</h1>');
      } else if (/^>\s*(.*$)/.test(line)) {
        // Blockquote
        html.push('<blockquote>' + formatInline(line.replace(/^>\s*/, '')) + '</blockquote>');
      } else if (line.trim() === '') {
        html.push('<p class="md-spacer"></p>');
      } else {
        html.push('<p>' + formatInline(line) + '</p>');
      }
    }

    if (inCodeBlock) html.push('</code></pre>');
    if (inList) html.push('</ul>');

    return html.join('');
  }

  function formatInline(text) {
    var escaped = sanitizeHtml(text);
    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    return escaped;
  }

  function countMetrics(text) {
    if (!text) return { words: 0, chars: 0, readingTimeMinutes: 0 };
    var clean = text.trim();
    var words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    var chars = clean.length;
    var readingTimeMinutes = Math.max(1, Math.ceil(words / 180));
    return {
      words: words,
      chars: chars,
      readingTimeMinutes: readingTimeMinutes
    };
  }

  function initNotes() {
    var win = $('#notes');
    if (!win) return;

    var editor = $('#notesEditor');
    var preview = $('#notesPreview');
    var tabWrite = $('#tabWrite');
    var tabPreview = $('#tabPreview');
    var saveStatus = $('#notesSaveStatus');
    var wordCountEl = $('#notesWordCount');
    var charCountEl = $('#notesCharCount');
    var exportBtn = $('#notesExportBtn');
    var templateSelect = $('#notesTemplateSelect');
    var clearBtn = $('#notesClearBtn');

    if (!editor || !preview) return;

    var saved = store.get(STORAGE_KEY, '');
    var currentContent = saved || DEFAULT_NOTE;
    editor.value = currentContent;

    function update() {
      var val = editor.value;
      preview.innerHTML = parseMarkdown(val);
      var metrics = countMetrics(val);
      if (wordCountEl) wordCountEl.textContent = metrics.words + ' words';
      if (charCountEl) charCountEl.textContent = metrics.chars + ' chars';
    }

    function save() {
      store.set(STORAGE_KEY, editor.value);
      if (saveStatus) {
        saveStatus.textContent = 'Saved to storage';
        saveStatus.classList.add('is-saved');
        setTimeout(function () {
          saveStatus.classList.remove('is-saved');
        }, 1800);
      }
    }

    editor.addEventListener('input', function () {
      update();
      save();
    });

    // Keyboard support: Ctrl+S / Cmd+S to export/save
    editor.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
        toast('📝 Dream note saved locally!');
        if (audio.isOn()) audio.pop();
      }
      // Tab key indentation support
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        update();
        save();
      }
    });

    if (tabWrite && tabPreview) {
      tabWrite.addEventListener('click', function () {
        tabWrite.classList.add('is-active');
        tabWrite.setAttribute('aria-selected', 'true');
        tabPreview.classList.remove('is-active');
        tabPreview.setAttribute('aria-selected', 'false');
        editor.hidden = false;
        preview.hidden = true;
      });

      tabPreview.addEventListener('click', function () {
        tabPreview.classList.add('is-active');
        tabPreview.setAttribute('aria-selected', 'true');
        tabWrite.classList.remove('is-active');
        tabWrite.setAttribute('aria-selected', 'false');
        update();
        editor.hidden = true;
        preview.hidden = false;
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportNote(editor.value);
      });
    }

    if (templateSelect) {
      templateSelect.addEventListener('change', function () {
        var key = templateSelect.value;
        if (TEMPLATES[key]) {
          editor.value = TEMPLATES[key];
          update();
          save();
          toast('📜 Loaded template: ' + key);
          if (audio.isOn()) audio.note(audio.SCALE[3], { dur: 0.8, gain: 0.15 });
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (window.confirm('Clear all dream notes?')) {
          editor.value = '';
          update();
          save();
          toast('Clean sheet ready.');
        }
      });
    }

    update();
  }

  function exportNote(content) {
    if (typeof Blob === 'undefined') return;
    var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pip-dream-notes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (audio.isOn()) {
      audio.note(audio.SCALE[5], { dur: 0.8, gain: 0.18 });
    }
    toast('💾 Notes exported as pip-dream-notes.md!');
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNotes);
    } else {
      initNotes();
    }
  }

  var notesAPI = {
    init: initNotes,
    parseMarkdown: parseMarkdown,
    sanitizeHtml: sanitizeHtml,
    countMetrics: countMetrics,
    exportNote: exportNote,
    TEMPLATES: TEMPLATES,
    STORAGE_KEY: STORAGE_KEY
  };

  PIP.notes = notesAPI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = notesAPI;
  }
})();
