'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('task-Nightlight Darkroom Proximity Radar Chime', () => {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const toysJs = fs.readFileSync(path.join(rootDir, 'js', 'toys.js'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');

  test('index.html contains #darkroomMask element in #darkroom', () => {
    assert.match(
      indexHtml,
      /<div\s+[^>]*id=["']darkroomMask["'][^>]*>/i,
      'index.html must contain an element with id="darkroomMask"'
    );
  });

  test('css/style.css defines .is-near on #darkroomMask / .dr-glow for subtle lantern glow expansion', () => {
    assert.match(
      css,
      /(?:#darkroomMask|\.dr-glow)\.is-near/,
      'css/style.css must define styling for #darkroomMask.is-near or .dr-glow.is-near'
    );
    assert.match(
      css,
      /(?:#darkroomMask|\.dr-glow)\.is-near\s*\{[^}]*filter:\s*drop-shadow/i,
      '#darkroomMask.is-near should expand glow with drop-shadow or transform'
    );
  });

  test('js/toys.js getRadarFrequency increases as distance decreases below 85px', () => {
    const toys = require('./toys.js');
    assert.strictEqual(typeof toys.getRadarFrequency, 'function');

    const fFar = toys.getRadarFrequency(85);
    const fMid = toys.getRadarFrequency(50);
    const fClose = toys.getRadarFrequency(10);
    const fZero = toys.getRadarFrequency(0);

    assert.ok(fFar <= fMid, 'Frequency at 85px must be less than or equal to 50px');
    assert.ok(fMid < fClose, 'Frequency at 50px must be less than at 10px');
    assert.ok(fClose <= fZero, 'Frequency at 10px must be less than or equal to 0px');
    assert.strictEqual(fFar, 520, 'Frequency at 85px boundary should be 520Hz');
    assert.ok(fZero >= 900, 'Frequency at 0px should be high alert pitch');
  });

  test('js/toys.js calls audio.note with gain 0.06 and dur 0.25 when distance < 85px', () => {
    assert.match(
      toysJs,
      /audio\.note\(\s*freq\s*,\s*\{\s*gain:\s*0\.06\s*,\s*dur:\s*0\.25\s*\}\s*\)/,
      'toys.js must invoke audio.note(freq, { gain: 0.06, dur: 0.25 })'
    );
    assert.match(
      toysJs,
      /nearestDist\s*<\s*85|dist\s*<\s*85|distance\s*<\s*85/,
      'toys.js must check if distance < 85'
    );
  });

  test('proximity radar detects nearest undiscovered target and triggers soft ping & .is-near class', (t, done) => {
    const notesCalled = [];
    const mockAudio = {
      isOn: () => true,
      note: (freq, opts) => {
        notesCalled.push({ freq, opts });
      }
    };

    const maskClasses = new Set();
    const mockMask = {
      classList: {
        add: (cls) => maskClasses.add(cls),
        remove: (cls) => maskClasses.delete(cls),
        contains: (cls) => maskClasses.has(cls)
      }
    };

    const targetItem1 = {
      classList: {
        contains: (cls) => cls === 'is-found',
        add: () => {},
        remove: () => {}
      },
      getBoundingClientRect: () => ({ left: 50, top: 50, width: 20, height: 20 }),
      getAttribute: () => 'found dream',
      style: { left: '10%', top: '10%' }
    };

    const targetItem2 = {
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {}
      },
      getBoundingClientRect: () => ({ left: 190, top: 190, width: 20, height: 20 }),
      getAttribute: () => 'starlight wisp',
      style: { left: '200px', top: '200px' }
    };

    const mockActiveRoom = {
      getAttribute: (k) => 'nursery',
      removeAttribute: () => {},
      setAttribute: () => {},
      classList: { toggle: () => {} },
      querySelectorAll: (sel) => [targetItem1, targetItem2]
    };

    const mockDarkroom = {
      style: { setProperty: () => {} },
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
      addEventListener: () => {},
      setAttribute: () => {},
      querySelector: (sel) => {
        if (sel.includes('.dr-room')) return mockActiveRoom;
        return null;
      },
      querySelectorAll: (sel) => {
        if (sel.includes('.dr-room')) return [mockActiveRoom];
        return [];
      }
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: () => {},
      removeEventListener: () => {},
      PIP: {
        audio: mockAudio,
        store: { get: () => 'nursery', set: () => {} },
        watchVisible: () => {}
      }
    };

    global.document = {
      createElement: () => ({
        setAttribute: () => {},
        style: { setProperty: () => {} },
        addEventListener: () => {}
      }),
      querySelector: (sel) => {
        if (sel === '#darkroom') return mockDarkroom;
        if (sel === '#darkroomMask') return mockMask;
        if (sel === '#lanterns') return { appendChild: () => {} };
        if (sel.includes('.dr-room')) return mockActiveRoom;
        return null;
      },
      querySelectorAll: () => [],
      addEventListener: () => {}
    };

    delete require.cache[require.resolve('./toys.js')];
    const toys = require('./toys.js');
    toys.initLights();

    assert.strictEqual(typeof toys.checkProximityRadar, 'function');

    // Trigger proximity radar
    const dist = toys.checkProximityRadar();

    // Since center is initially (200, 200), distance to targetItem2 (200, 200) is 0 < 85
    assert.ok(dist < 85, `Distance should be within 85px radar range, got ${dist}`);
    assert.strictEqual(notesCalled.length, 1, 'Should trigger one soft ping note');
    assert.strictEqual(notesCalled[0].opts.gain, 0.06);
    assert.strictEqual(notesCalled[0].opts.dur, 0.25);
    assert.ok(mockMask.classList.contains('is-near'), '#darkroomMask must have .is-near added');

    // After brief timeout, .is-near should be removed
    setTimeout(() => {
      assert.strictEqual(mockMask.classList.contains('is-near'), false, '.is-near should be removed after timeout');
      done();
    }, 300);
  });
});
