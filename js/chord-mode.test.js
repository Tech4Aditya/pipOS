const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const TOYS_JS_PATH = path.join(ROOT_DIR, 'js', 'toys.js');

test('index.html contains #chordModeBtn toggle inside .lab-actions with accessible attributes', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  assert.match(html, /<div[^>]*class=["'][^"']*\blab-actions\b[^"']*["'][\s\S]*?<button[^>]*id=["']chordModeBtn["']/i,
    'Must include button with id="chordModeBtn" inside .lab-actions');
  const btnMatch = html.match(/<button[^>]*id=["']chordModeBtn["'][^>]*>([\s\S]*?)<\/button>/i);
  assert.ok(btnMatch, 'Must find #chordModeBtn');
  const btnTag = btnMatch[0];
  assert.ok(btnTag.includes('aria-pressed="false"'), 'Must have aria-pressed="false" initially');
  assert.match(btnTag, /aria-label=["'][^"']*Chord[^"']*["']/i, 'Must have accessible aria-label');
  assert.match(btnMatch[1], /Chords\s*✨/i, 'Button text must include Chords ✨');
});

test('js/toys.js initLab toggles chord mode, persists state, and plays harmonizing companion notes', () => {
  const notesPlayed = [];
  let chordBtnListener = null;
  let keyListeners = [];
  let stored = {};

  const mockChordBtn = {
    attributes: { 'aria-pressed': 'false' },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    classList: {
      toggle(cls, state) { this[cls] = state; }
    },
    addEventListener(evt, fn) {
      if (evt === 'click') chordBtnListener = fn;
    }
  };

  const mockKeysEl = {
    appendChild(child) {
      if (child.listeners && child.listeners.click) {
        keyListeners.push(child.listeners.click);
      }
    }
  };

  const mockStage = {
    appendChild() {}
  };

  const mockWind = {
    setAttribute() {},
    addEventListener() {}
  };

  const mockEndless = {
    setAttribute() {},
    classList: { add() {}, remove() {} },
    addEventListener() {}
  };

  global.window = {
    setTimeout: (fn) => fn(),
    clearTimeout: () => {}
  };

  global.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        style: { setProperty() {} },
        listeners: {},
        setAttribute() {},
        addEventListener(evt, fn) { this.listeners[evt] = fn; },
        classList: { add() {}, remove() {} }
      };
      return el;
    },
    addEventListener() {}
  };

  global.PIP = {
    $: (sel) => {
      if (sel === '#keys') return mockKeysEl;
      if (sel === '#mbStage') return mockStage;
      if (sel === '#windBtn') return mockWind;
      if (sel === '#endlessBtn') return mockEndless;
      if (sel === '#chordModeBtn') return mockChordBtn;
      return null;
    },
    store: {
      get: (k, d) => stored[k] !== undefined ? stored[k] : d,
      set: (k, v) => { stored[k] = v; }
    },
    reduceMotion: { matches: true },
    watchVisible: () => {},
    audio: {
      request: () => true,
      onChange: () => {},
      isEndless: () => false,
      SCALE: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
      note: (freq, opts) => {
        notesPlayed.push({ freq, opts });
      }
    }
  };
  global.window.PIP = global.PIP;

  try {
    // Load and execute toys.js
    delete require.cache[require.resolve(TOYS_JS_PATH)];
    const toys = require(TOYS_JS_PATH);
    toys.initLab();

    assert.strictEqual(typeof chordBtnListener, 'function', 'Must register click listener on chordBtn');
    assert.strictEqual(keyListeners.length, 8, 'Must register 8 key listeners');

    // 1. Initially chord mode is OFF -> tapping key 0 triggers only 1 note
    notesPlayed.length = 0;
    keyListeners[0]();
    assert.strictEqual(notesPlayed.length, 1, 'Single note when chord mode is inactive');
    assert.strictEqual(notesPlayed[0].freq, 261.63);

    // 2. Click chordBtn -> turns chord mode ON
    chordBtnListener();
    assert.strictEqual(stored.chord_mode, 'on', 'Must persist chord_mode as "on"');
    assert.strictEqual(mockChordBtn.getAttribute('aria-pressed'), 'true');

    // 3. Tapping key 0 with chord mode ON -> triggers primary note + harmonizing companion note (f * 1.25)
    notesPlayed.length = 0;
    keyListeners[0]();
    assert.strictEqual(notesPlayed.length, 2, 'Must trigger 2 notes (primary + companion harmony)');
    assert.strictEqual(notesPlayed[0].freq, 261.63);
    assert.strictEqual(notesPlayed[1].freq, 261.63 * 1.25);
    assert.strictEqual(notesPlayed[1].opts.when, 0.05);
    assert.strictEqual(notesPlayed[1].opts.gain, 0.1);
  } finally {
    delete global.window;
    delete global.document;
    delete global.PIP;
  }
});
