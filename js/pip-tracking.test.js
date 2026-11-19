const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PIP_JS_PATH = path.join(ROOT_DIR, 'js', 'pip.js');
const TERM_JS_PATH = path.join(ROOT_DIR, 'js', 'terminal.js');

test('js/pip.js defines lerpFactor with default 0.15 and tracking modes', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  assert.match(pipSrc, /lerpFactor\s*=\s*0\.15/, 'Must define default lerpFactor as 0.15');
  assert.match(pipSrc, /function\s+setTrackingMode\s*\(/, 'Must define setTrackingMode');
  assert.match(pipSrc, /snappy:\s*1(?:\.0)?/, 'TRACKING_MODES must map snappy to 1.0');
  assert.match(pipSrc, /smooth:\s*0\.18/, 'TRACKING_MODES must map smooth to 0.18');
  assert.match(pipSrc, /sleepy:\s*0\.05/, 'TRACKING_MODES must map sleepy to 0.05');

  const pip = require(PIP_JS_PATH);
  assert.strictEqual(typeof pip.setTrackingMode, 'function', 'Must export setTrackingMode');
  assert.strictEqual(typeof pip.getTrackingMode, 'function', 'Must export getTrackingMode');
});

test('PIP.pip.setTrackingMode configures snappy, smooth, and sleepy factors', () => {
  const pip = require(PIP_JS_PATH);

  // Initial / default
  assert.strictEqual(pip.lerpFactor, 0.15, 'Default lerpFactor should be 0.15');

  // Snappy: factor 1.0
  const snappyRes = pip.setTrackingMode('snappy');
  assert.strictEqual(snappyRes, true, 'setTrackingMode("snappy") should return true');
  assert.strictEqual(pip.lerpFactor, 1.0, 'snappy lerpFactor must be 1.0');
  assert.strictEqual(pip.getTrackingMode(), 'snappy');

  // Smooth: factor 0.18
  const smoothRes = pip.setTrackingMode('smooth');
  assert.strictEqual(smoothRes, true, 'setTrackingMode("smooth") should return true');
  assert.strictEqual(pip.lerpFactor, 0.18, 'smooth lerpFactor must be 0.18');
  assert.strictEqual(pip.getTrackingMode(), 'smooth');

  // Sleepy: factor 0.05
  const sleepyRes = pip.setTrackingMode('sleepy');
  assert.strictEqual(sleepyRes, true, 'setTrackingMode("sleepy") should return true');
  assert.strictEqual(pip.lerpFactor, 0.05, 'sleepy lerpFactor must be 0.05');
  assert.strictEqual(pip.getTrackingMode(), 'sleepy');

  // Unknown mode
  const unknownRes = pip.setTrackingMode('invalid_mode');
  assert.strictEqual(unknownRes, false, 'Invalid mode should return false');
  assert.strictEqual(pip.lerpFactor, 0.05, 'lerpFactor must not change on invalid mode');
});

test('js/terminal.js exposes pip tracking [mode] command', () => {
  const term = require(TERM_JS_PATH);
  const pip = require(PIP_JS_PATH);

  // Set global PIP reference
  global.PIP = global.PIP || {};
  global.PIP.pip = pip;

  // Verify COMMANDS list includes 'pip'
  assert.ok(term.COMMANDS.includes('pip'), 'term.COMMANDS must include "pip"');

  // Help command lists pip tracking
  const helpRes = term.executeCommand('help');
  assert.match(helpRes.output, /pip tracking/i, 'help manual must list pip tracking command');

  // Usage info when no arguments provided
  const bareRes = term.executeCommand('pip tracking');
  assert.ok(bareRes.ok);
  assert.match(bareRes.output, /Usage: pip tracking/i);

  // Set snappy mode
  const snappyRes = term.executeCommand('pip tracking snappy');
  assert.ok(snappyRes.ok);
  assert.match(snappyRes.output, /snappy/i);
  assert.strictEqual(pip.lerpFactor, 1.0);
  assert.strictEqual(pip.getTrackingMode(), 'snappy');

  // Set smooth mode
  const smoothRes = term.executeCommand('pip tracking smooth');
  assert.ok(smoothRes.ok);
  assert.match(smoothRes.output, /smooth/i);
  assert.strictEqual(pip.lerpFactor, 0.18);
  assert.strictEqual(pip.getTrackingMode(), 'smooth');

  // Set sleepy mode
  const sleepyRes = term.executeCommand('pip tracking sleepy');
  assert.ok(sleepyRes.ok);
  assert.match(sleepyRes.output, /sleepy/i);
  assert.strictEqual(pip.lerpFactor, 0.05);
  assert.strictEqual(pip.getTrackingMode(), 'sleepy');

  // Invalid mode feedback
  const errRes = term.executeCommand('pip tracking hyperactive');
  assert.ok(errRes.ok);
  assert.match(errRes.output, /Unknown tracking mode/i);
});

test('look() applies snappy (direct) vs smoothed eye tracking in mock DOM', () => {
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');

  let curTransformL = '';
  let curTransformR = '';
  let curHeadTransform = '';

  const mockSocket = {
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 20, height: 20 })
  };

  const mockPupilL = {
    style: {
      set transform(v) { curTransformL = v; },
      get transform() { return curTransformL; }
    }
  };

  const mockPupilR = {
    style: {
      set transform(v) { curTransformR = v; },
      get transform() { return curTransformR; }
    }
  };

  const mockHead = {
    addEventListener: () => {},
    style: {
      set transform(v) { curHeadTransform = v; },
      get transform() { return curHeadTransform; }
    }
  };

  const mockSvg = {
    querySelectorAll: (sel) => [mockSocket, mockSocket],
    classList: { add: () => {}, remove: () => {} },
    getBoundingClientRect: () => ({ left: 50, top: 50, width: 120, height: 120 })
  };

  const mockWindow = {
    innerWidth: 1000,
    innerHeight: 800,
    addEventListener: () => {},
    setTimeout: (fn) => 1,
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => 1,
    performance: { now: () => 1000 }
  };

  const mockDoc = {
    hidden: false,
    addEventListener: () => {}
  };

  const mockPIP = {
    $: (sel) => {
      if (sel === '#pipSvg') return mockSvg;
      if (sel === '#pipHead') return mockHead;
      if (sel === '#pupilL') return mockPupilL;
      if (sel === '#pupilR') return mockPupilR;
      return null;
    },
    store: { get: () => '', set: () => {} },
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    reduceMotion: { matches: false }
  };

  mockWindow.PIP = mockPIP;

  const runCode = new Function('window', 'document', 'performance', pipSrc);
  runCode(mockWindow, mockDoc, mockWindow.performance);

  mockPIP.pip.init();

  // Test 1: Snappy Mode (factor 1.0) - direct tracking
  mockPIP.pip.setTrackingMode('snappy');
  assert.strictEqual(mockPIP.pip.lerpFactor, 1.0);

  mockPIP.pip.look(300, 300);
  const snappyTransform = curTransformL;
  assert.ok(snappyTransform.length > 0, 'Transform should be set');

  // Test 2: Sleepy Mode (factor 0.05) - slow drift from center
  mockPIP.pip.setTrackingMode('sleepy');
  assert.strictEqual(mockPIP.pip.lerpFactor, 0.05);

  // Reset positions to 0,0 and look at same target
  mockPIP.pip.look(110, 110); // neutral look
  mockPIP.pip.look(300, 300); // 1 single frame of sleepy look
  const sleepyTransform = curTransformL;

  assert.ok(sleepyTransform.length > 0);
  assert.notStrictEqual(sleepyTransform, snappyTransform, 'Sleepy single step must not jump directly to snappy target');
});
