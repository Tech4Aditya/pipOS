const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const visualizer = require('./visualizer.js');

describe('Master Audio Oscilloscope & Frequency Visualizer (pip-visualizer.exe)', () => {
  beforeEach(() => {
    visualizer.setMode('waveform');
    visualizer.setTheme('green');
    visualizer.setGain(1.0);
  });

  test('THEMES dictionary contains green, amber, berry, and cyan palettes', () => {
    assert.ok(visualizer.THEMES.green);
    assert.ok(visualizer.THEMES.amber);
    assert.ok(visualizer.THEMES.berry);
    assert.ok(visualizer.THEMES.cyan);

    ['green', 'amber', 'berry', 'cyan'].forEach((th) => {
      const p = visualizer.THEMES[th];
      assert.ok(p.primary, `Theme ${th} must have primary color`);
      assert.ok(p.secondary, `Theme ${th} must have secondary color`);
      assert.ok(p.glow, `Theme ${th} must have glow color`);
      assert.ok(p.bg, `Theme ${th} must have background color`);
    });
  });

  test('setMode validates and toggles waveform, bars, and orbit', () => {
    assert.strictEqual(visualizer.setMode('bars'), true);
    assert.strictEqual(visualizer.getMode(), 'bars');

    assert.strictEqual(visualizer.setMode('orbit'), true);
    assert.strictEqual(visualizer.getMode(), 'orbit');

    assert.strictEqual(visualizer.setMode('waveform'), true);
    assert.strictEqual(visualizer.getMode(), 'waveform');

    assert.strictEqual(visualizer.setMode('invalid-mode'), false);
    assert.strictEqual(visualizer.getMode(), 'waveform');
  });

  test('setTheme switches themes and ignores invalid themes', () => {
    assert.strictEqual(visualizer.setTheme('amber'), true);
    assert.strictEqual(visualizer.getTheme(), 'amber');

    assert.strictEqual(visualizer.setTheme('cyan'), true);
    assert.strictEqual(visualizer.getTheme(), 'cyan');

    assert.strictEqual(visualizer.setTheme('unknown'), false);
    assert.strictEqual(visualizer.getTheme(), 'cyan');
  });

  test('setGain adjusts sensitivity scale within bounds [0.2, 4.0]', () => {
    assert.strictEqual(visualizer.setGain(2.5), true);
    assert.strictEqual(visualizer.getState().gain, 2.5);

    assert.strictEqual(visualizer.setGain(0.1), false);
    assert.strictEqual(visualizer.getState().gain, 2.5); // unchanged

    assert.strictEqual(visualizer.setGain(5.0), false);
    assert.strictEqual(visualizer.getState().gain, 2.5); // unchanged
  });

  test('toggleFreeze inverts freezing state', () => {
    const initial = visualizer.getState().frozen;
    const toggled = visualizer.toggleFreeze();
    assert.strictEqual(toggled, !initial);
    assert.strictEqual(visualizer.toggleFreeze(), initial);
  });

  test('index.html contains #visualizer window, canvas, toolbar controls, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="visualizer"'), 'index.html must include #visualizer window');
    assert.ok(html.includes('id="visTitle"'), 'index.html must include #visTitle');
    assert.ok(html.includes('id="visCanvas"'), 'index.html must include #visCanvas');
    assert.ok(html.includes('data-mode="waveform"'), 'index.html must include waveform mode button');
    assert.ok(html.includes('data-mode="bars"'), 'index.html must include bars mode button');
    assert.ok(html.includes('data-mode="orbit"'), 'index.html must include orbit mode button');
    assert.ok(html.includes('id="visThemeSelect"'), 'index.html must include theme selector');
    assert.ok(html.includes('id="visGainSlider"'), 'index.html must include gain slider');
    assert.ok(html.includes('id="visFreezeBtn"'), 'index.html must include freeze button');
    assert.ok(html.includes('src="js/visualizer.js"'), 'index.html must include js/visualizer.js script tag');
  });
});
