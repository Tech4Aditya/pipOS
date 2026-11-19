'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('task-Lullaby Lab Harmony', () => {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const toysJs = fs.readFileSync(path.join(rootDir, 'js', 'toys.js'), 'utf8');

  test('index.html contains #chordModeBtn toggle button inside .lab-actions', () => {
    const labActionsMatch = indexHtml.match(/<div\s+[^>]*class=["'][^"']*\blab-actions\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    assert.ok(labActionsMatch, 'index.html must contain .lab-actions element');
    const labActionsContent = labActionsMatch[1];

    assert.match(
      labActionsContent,
      /<button[^>]*id=["']chordModeBtn["'][^>]*>/i,
      '.lab-actions must contain a button with id="chordModeBtn"'
    );
    assert.match(
      labActionsContent,
      /id=["']chordModeBtn["'][^>]*aria-pressed=["']false["']/i,
      '#chordModeBtn must have initial aria-pressed="false"'
    );
  });

  test('js/toys.js defines chordActive state and triggers f * 1.25 harmony note', () => {
    assert.match(
      toysJs,
      /chordActive/,
      'toys.js must track chordActive boolean toggle'
    );
    assert.match(
      toysJs,
      /audio\.note\(\s*f\s*\*\s*1\.25\s*,\s*\{\s*dur:\s*1\.2\s*,\s*gain:\s*0\.1\s*,\s*when:\s*0\.05\s*\}\s*\)/,
      'toys.js must call audio.note(f * 1.25, { dur: 1.2, gain: 0.1, when: 0.05 }) when chordActive is true'
    );
  });

  test('chordModeBtn toggles chordActive state, aria-pressed, and .is-on class', () => {
    const listeners = {};
    const classes = new Set();
    const mockChordBtn = {
      textContent: 'Harmony: Off',
      setAttribute: (k, v) => { mockChordBtn[k] = v; },
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        toggle: (c, force) => {
          if (force) classes.add(c);
          else classes.delete(c);
        },
        contains: (c) => classes.has(c)
      },
      addEventListener: (evt, fn) => { listeners[evt] = fn; },
      click: () => { if (listeners.click) listeners.click(); }
    };

    const mockKeys = {
      appendChild: () => {}
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout: () => {},
      PIP: {
        watchVisible: () => {}
      }
    };

    global.document = {
      createElement: () => ({
        setAttribute: () => {},
        style: { setProperty: () => {} },
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {}
      }),
      querySelector: (sel) => {
        if (sel === '#chordModeBtn') return mockChordBtn;
        if (sel === '#keys') return mockKeys;
        if (sel === '#mbStage') return { appendChild: () => {} };
        if (sel === '#windBtn') return { addEventListener: () => {} };
        if (sel === '#endlessBtn') return { addEventListener: () => {} };
        return null;
      },
      querySelectorAll: () => [],
      addEventListener: () => {}
    };

    delete require.cache[require.resolve('./toys.js')];
    const toys = require('./toys.js');
    toys.initLab();

    // Default chordActive should be false
    assert.strictEqual(toys.isChordMode(), false);

    // Toggle on
    mockChordBtn.click();
    assert.strictEqual(toys.isChordMode(), true);
    assert.strictEqual(mockChordBtn['aria-pressed'], 'true');
    assert.ok(mockChordBtn.classList.contains('is-on'));
    assert.strictEqual(mockChordBtn.textContent, 'Harmony: On');

    // Toggle off
    mockChordBtn.click();
    assert.strictEqual(toys.isChordMode(), false);
    assert.strictEqual(mockChordBtn['aria-pressed'], 'false');
    assert.strictEqual(mockChordBtn.classList.contains('is-on'), false);
    assert.strictEqual(mockChordBtn.textContent, 'Harmony: Off');
  });

  test('press(index) plays single note when chordActive is false, and root + 1.25x major third when true', () => {
    const notesPlayed = [];
    const mockAudio = {
      request: () => true,
      isOn: () => true,
      onChange: () => {},
      SCALE: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
      note: (freq, opts) => {
        notesPlayed.push({ freq, opts });
      }
    };

    const mockChordBtn = {
      setAttribute: () => {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      addEventListener: () => {}
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout: () => {},
      PIP: {
        audio: mockAudio,
        watchVisible: () => {}
      }
    };

    global.document = {
      createElement: () => ({
        setAttribute: () => {},
        style: { setProperty: () => {} },
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {}
      }),
      querySelector: (sel) => {
        if (sel === '#chordModeBtn') return mockChordBtn;
        if (sel === '#keys') return { appendChild: () => {} };
        if (sel === '#mbStage') return { appendChild: () => {} };
        if (sel === '#windBtn') return { addEventListener: () => {} };
        if (sel === '#endlessBtn') return { addEventListener: () => {} };
        return null;
      },
      querySelectorAll: () => [],
      addEventListener: () => {}
    };

    delete require.cache[require.resolve('./toys.js')];
    const toys = require('./toys.js');
    toys.initLab();

    // 1. When chordActive is false:
    toys.setChordMode(false);
    notesPlayed.length = 0;
    toys.press(0); // Note 0 (C4 = 261.63)

    assert.strictEqual(notesPlayed.length, 1, 'Only root note should play when chordActive is false');
    assert.strictEqual(notesPlayed[0].freq, 261.63);

    // 2. When chordActive is true:
    toys.setChordMode(true);
    notesPlayed.length = 0;
    toys.press(0); // Note 0 (C4 = 261.63)

    assert.strictEqual(notesPlayed.length, 2, 'Two notes (root and harmonizer) must play when chordActive is true');
    assert.strictEqual(notesPlayed[0].freq, 261.63, 'First note must be root pitch');

    const harm = notesPlayed[1];
    const expectedHarmFreq = 261.63 * 1.25; // 327.0375
    assert.strictEqual(harm.freq, expectedHarmFreq, 'Harmonizing note frequency must be f * 1.25');
    assert.strictEqual(harm.opts.dur, 1.2, 'Harmonizing note duration must be 1.2');
    assert.strictEqual(harm.opts.gain, 0.1, 'Harmonizing note gain must be 0.1');
    assert.strictEqual(harm.opts.when, 0.05, 'Harmonizing note when offset must be 0.05');

    // Test another scale index (G4 = 392.00)
    notesPlayed.length = 0;
    toys.press(3);
    assert.strictEqual(notesPlayed.length, 2);
    assert.strictEqual(notesPlayed[0].freq, 392.00);
    assert.strictEqual(notesPlayed[1].freq, 392.00 * 1.25);
  });
});
