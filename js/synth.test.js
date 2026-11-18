'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock browser globals if running under node
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof document === 'undefined') {
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
}

const synth = require('./synth.js');

describe('Starlight Synthesizer & Sequencer (pip-synth.exe)', () => {
  test('grid initialization and cell toggling', () => {
    synth.clearGrid();
    assert.strictEqual(synth.getCell(0, 0), false);

    const toggled = synth.toggleCell(0, 0);
    assert.strictEqual(toggled, true);
    assert.strictEqual(synth.getCell(0, 0), true);

    const toggledOff = synth.toggleCell(0, 0);
    assert.strictEqual(toggledOff, false);
    assert.strictEqual(synth.getCell(0, 0), false);
  });

  test('bounds check on toggleCell ignores out-of-range coordinates', () => {
    assert.strictEqual(synth.toggleCell(-1, 0), false);
    assert.strictEqual(synth.toggleCell(8, 0), false);
    assert.strictEqual(synth.toggleCell(0, 10), false);
  });

  test('clearGrid resets all 8 steps to inactive state', () => {
    synth.toggleCell(1, 2);
    synth.toggleCell(3, 4);
    synth.clearGrid();

    for (let s = 0; s < synth.NUM_STEPS; s++) {
      for (let n = 0; n < synth.NOTES.length; n++) {
        assert.strictEqual(synth.getCell(s, n), false);
      }
    }
  });

  test('setBpm clamps tempo to safe lullaby range [50, 180]', () => {
    assert.strictEqual(synth.setBpm(120), 120);
    assert.strictEqual(synth.getBpm(), 120);

    // Below min
    synth.setBpm(20);
    assert.strictEqual(synth.getBpm(), 120, 'Should reject values below 50');

    // Above max
    synth.setBpm(250);
    assert.strictEqual(synth.getBpm(), 120, 'Should reject values above 180');

    // Valid
    assert.strictEqual(synth.setBpm(80), 80);
  });

  test('setWaveform supports sine and triangle and rejects invalid types', () => {
    assert.strictEqual(synth.setWaveform('triangle'), 'triangle');
    assert.strictEqual(synth.getWaveform(), 'triangle');

    assert.strictEqual(synth.setWaveform('sine'), 'sine');
    assert.strictEqual(synth.getWaveform(), 'sine');

    synth.setWaveform('sawtooth');
    assert.strictEqual(synth.getWaveform(), 'sine', 'Should keep previous valid waveform');
  });

  test('encodeWav creates valid RIFF WAVE binary structure', () => {
    const sampleRate = 22050;
    const testSamples = new Float32Array(100);
    for (let i = 0; i < testSamples.length; i++) {
      testSamples[i] = Math.sin(i * 0.1);
    }

    const blob = synth.encodeWav(sampleRate, testSamples);
    assert.ok(blob, 'Blob should be created');
    assert.strictEqual(blob.type, 'audio/wav');
    assert.strictEqual(blob.size, 44 + 100 * 2, 'Size must equal 44-byte header + 200 bytes PCM');
  });

  test('NOTES provides 5 harmonious pentatonic frequencies', () => {
    assert.strictEqual(synth.NOTES.length, 5);
    const names = synth.NOTES.map(n => n.name);
    assert.deepStrictEqual(names, ['C5', 'D5', 'E5', 'G5', 'A5']);
  });
});
