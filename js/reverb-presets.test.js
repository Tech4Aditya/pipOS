'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const STYLE_CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');
const AUDIO_JS_PATH = path.join(ROOT_DIR, 'js', 'audio.js');
const TOYS_JS_PATH = path.join(ROOT_DIR, 'js', 'toys.js');

describe('Acoustic Reverb Space Presets', () => {
  test('index.html contains #reverbPreset select with crib, attic, and sky options in Lullaby Lab', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    assert.ok(html.includes('id="reverbPreset"'), 'index.html must contain #reverbPreset element');
    assert.ok(html.includes('class="reverb-wrap"'), 'index.html must contain .reverb-wrap container');
    assert.ok(html.includes('value="crib"'), 'Must contain option for crib preset');
    assert.ok(html.includes('value="attic"'), 'Must contain option for attic preset');
    assert.ok(html.includes('value="sky"'), 'Must contain option for sky preset');
    assert.match(
      html,
      /<select[^>]*id="reverbPreset"[^>]*>[\s\S]*?<option[^>]*value="crib"[^>]*>[\s\S]*?<option[^>]*value="attic"[^>]*selected[\s\S]*?<option[^>]*value="sky"/,
      'Select must have crib, attic (selected by default), and sky options in order'
    );
    assert.match(
      html,
      /<label[^>]*for="reverbPreset"/,
      'Must have label associated with #reverbPreset'
    );
  });

  test('css/style.css defines layout rules for .reverb-wrap alongside .tune-wrap and .vol-wrap', () => {
    const css = fs.readFileSync(STYLE_CSS_PATH, 'utf8');
    assert.match(
      css,
      /\.reverb-wrap/,
      'css/style.css must include .reverb-wrap class'
    );
    assert.match(
      css,
      /\.tune-wrap,\s*\.reverb-wrap,\s*\.vol-wrap/,
      '.reverb-wrap should be styled with flex layout alongside .tune-wrap and .vol-wrap'
    );
  });

  test('js/audio.js exports REVERB_PRESETS with exact acoustic specifications', () => {
    const audio = require(AUDIO_JS_PATH);

    assert.ok(audio.REVERB_PRESETS, 'audio.REVERB_PRESETS must be exported');
    assert.strictEqual(typeof audio.REVERB_PRESETS, 'object', 'REVERB_PRESETS must be an object');

    // crib: { seconds: 1.0, decay: 4.5 } (tight, dry)
    assert.ok(audio.REVERB_PRESETS.crib, 'crib preset must exist');
    assert.strictEqual(audio.REVERB_PRESETS.crib.seconds, 1.0, 'crib seconds must be 1.0');
    assert.strictEqual(audio.REVERB_PRESETS.crib.decay, 4.5, 'crib decay must be 4.5');

    // attic: { seconds: 2.2, decay: 3.0 } (default warm chamber)
    assert.ok(audio.REVERB_PRESETS.attic, 'attic preset must exist');
    assert.strictEqual(audio.REVERB_PRESETS.attic.seconds, 2.2, 'attic seconds must be 2.2');
    assert.strictEqual(audio.REVERB_PRESETS.attic.decay, 3.0, 'attic decay must be 3.0');

    // sky: { seconds: 4.2, decay: 1.8 } (sprawling cosmic cathedral)
    assert.ok(audio.REVERB_PRESETS.sky, 'sky preset must exist');
    assert.strictEqual(audio.REVERB_PRESETS.sky.seconds, 4.2, 'sky seconds must be 4.2');
    assert.strictEqual(audio.REVERB_PRESETS.sky.decay, 1.8, 'sky decay must be 1.8');
  });

  test('js/audio.js exports setReverbPreset and getReverbPreset API methods', () => {
    const audio = require(AUDIO_JS_PATH);

    assert.strictEqual(typeof audio.setReverbPreset, 'function', 'setReverbPreset must be a function');
    assert.strictEqual(typeof audio.getReverbPreset, 'function', 'getReverbPreset must be a function');
    assert.strictEqual(typeof audio.masterBus.setReverbPreset, 'function', 'masterBus.setReverbPreset must be exported');
    assert.strictEqual(typeof audio.masterBus.getReverbPreset, 'function', 'masterBus.getReverbPreset must be exported');
    assert.ok(audio.masterBus.REVERB_PRESETS, 'masterBus.REVERB_PRESETS must be exported');

    // Default or initial preset
    const initial = audio.getReverbPreset();
    assert.ok(['crib', 'attic', 'sky'].includes(initial), 'Initial preset must be one of crib, attic, sky');

    // Switching to crib
    assert.strictEqual(audio.setReverbPreset('crib'), true, 'Setting crib must return true');
    assert.strictEqual(audio.getReverbPreset(), 'crib', 'Active preset must be crib');

    // Switching to sky
    assert.strictEqual(audio.setReverbPreset('sky'), true, 'Setting sky must return true');
    assert.strictEqual(audio.getReverbPreset(), 'sky', 'Active preset must be sky');

    // Switching to attic
    assert.strictEqual(audio.setReverbPreset('attic'), true, 'Setting attic must return true');
    assert.strictEqual(audio.getReverbPreset(), 'attic', 'Active preset must be attic');

    // Invalid preset rejected without modifying active preset
    assert.strictEqual(audio.setReverbPreset('outer-space-invalid'), false, 'Setting invalid preset must return false');
    assert.strictEqual(audio.getReverbPreset(), 'attic', 'Active preset must remain attic after invalid call');
    assert.strictEqual(audio.setReverbPreset(null), false);
    assert.strictEqual(audio.setReverbPreset(''), false);
  });

  test('makeImpulse produces buffers corresponding to preset seconds and decay', () => {
    const audio = require(AUDIO_JS_PATH);
    const mockCtx = {
      sampleRate: 44100,
      createBuffer: (channels, length, sampleRate) => {
        const buffers = [new Float32Array(length), new Float32Array(length)];
        return {
          numberOfChannels: channels,
          length: length,
          sampleRate: sampleRate,
          getChannelData: (ch) => buffers[ch]
        };
      }
    };

    const cribBuf = audio.makeImpulse(mockCtx, audio.REVERB_PRESETS.crib.seconds, audio.REVERB_PRESETS.crib.decay);
    assert.strictEqual(cribBuf.length, Math.floor(44100 * 1.0), 'Crib impulse length must match 1.0s');

    const atticBuf = audio.makeImpulse(mockCtx, audio.REVERB_PRESETS.attic.seconds, audio.REVERB_PRESETS.attic.decay);
    assert.strictEqual(atticBuf.length, Math.floor(44100 * 2.2), 'Attic impulse length must match 2.2s');

    const skyBuf = audio.makeImpulse(mockCtx, audio.REVERB_PRESETS.sky.seconds, audio.REVERB_PRESETS.sky.decay);
    assert.strictEqual(skyBuf.length, Math.floor(44100 * 4.2), 'Sky impulse length must match 4.2s');
  });

  test('js/toys.js wires #reverbPreset change listener to audio.setReverbPreset', () => {
    const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

    assert.ok(
      toysSrc.includes('#reverbPreset'),
      'js/toys.js must query #reverbPreset element'
    );
    assert.match(
      toysSrc,
      /audio\.setReverbPreset\(\s*this\.value\s*\)/,
      'js/toys.js must invoke audio.setReverbPreset on select change'
    );
    assert.match(
      toysSrc,
      /audio\.getReverbPreset\(\)/,
      'js/toys.js must sync select value with audio.getReverbPreset()'
    );
  });
});
