const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');
const AUDIO_JS_PATH = path.resolve(__dirname, 'audio.js');
const TOYS_JS_PATH = path.resolve(__dirname, 'toys.js');

test('index.html contains accessible ambient sound controls in Lullaby Lab', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /id=["']ambientRainBtn["']/, 'Lullaby Lab must contain #ambientRainBtn');
  assert.match(html, /id=["']ambientCricketsBtn["']/, 'Lullaby Lab must contain #ambientCricketsBtn');
  assert.match(html, /id=["']ambientWindBtn["']/, 'Lullaby Lab must contain #ambientWindBtn');
  assert.match(html, /id=["']ambientSlider["']/, 'Lullaby Lab must contain #ambientSlider');
  assert.match(html, /aria-label=["']Ambient night sounds volume["']/, 'ambientSlider must have accessible aria-label');
  assert.match(html, /class=["'][^"']*\bambient-bar\b[^"']*["']/, 'Must contain .ambient-bar container');
});

test('css/style.css defines styling for ambient bar, buttons, and night mode', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.ambient-bar\s*\{/, 'Must define .ambient-bar container styling');
  assert.match(css, /\.ambient-actions\s*\{/, 'Must define .ambient-actions flex styling');
  assert.match(css, /\.btn-ambient\s*\{/, 'Must define .btn-ambient styling');
  assert.match(css, /\.btn-ambient\.is-on\s*\{/, 'Must define .btn-ambient active state');
  assert.match(css, /\[data-theme=["']night["']\]\s*\.btn-ambient\.is-on/, 'Must define night theme active styling');
  assert.match(css, /\.ambient-wrap\s*\{/, 'Must define .ambient-wrap slider group styling');
});

test('js/audio.js implements ambient sound generators and exports', () => {
  const audioSrc = fs.readFileSync(AUDIO_JS_PATH, 'utf8');

  assert.match(audioSrc, /function\s+startRain\s*\(/, 'audio.js must define startRain');
  assert.match(audioSrc, /function\s+stopRain\s*\(/, 'audio.js must define stopRain');
  assert.match(audioSrc, /function\s+isRainActive\s*\(/, 'audio.js must define isRainActive');
  assert.match(audioSrc, /function\s+startCrickets\s*\(/, 'audio.js must define startCrickets');
  assert.match(audioSrc, /function\s+stopCrickets\s*\(/, 'audio.js must define stopCrickets');
  assert.match(audioSrc, /function\s+isCricketsActive\s*\(/, 'audio.js must define isCricketsActive');
  assert.match(audioSrc, /function\s+startWind\s*\(/, 'audio.js must define startWind');
  assert.match(audioSrc, /function\s+stopWind\s*\(/, 'audio.js must define stopWind');
  assert.match(audioSrc, /function\s+isWindActive\s*\(/, 'audio.js must define isWindActive');
  assert.match(audioSrc, /function\s+stopAmbient\s*\(/, 'audio.js must define stopAmbient');
  assert.match(audioSrc, /function\s+setAmbientLevel\s*\(/, 'audio.js must define setAmbientLevel');
  assert.match(audioSrc, /function\s+getAmbientLevel\s*\(/, 'audio.js must define getAmbientLevel');
  assert.match(audioSrc, /createBiquadFilter\(\)/, 'Rain/Wind must use BiquadFilterNode to shape noise');
  assert.match(audioSrc, /createBuffer\(/, 'Rain/Wind must procedurally generate noise buffer');
  assert.match(audioSrc, /stopWind\(\)/, 'stopAmbient must call stopWind()');
});

test('js/audio.js implements procedural wind synthesizer with LFO modulation and exports', () => {
  const audioSrc = fs.readFileSync(AUDIO_JS_PATH, 'utf8');
  assert.match(audioSrc, /windLfo\s*=\s*ctx\.createOscillator\(\)/, 'Wind must use LFO oscillator');
  assert.match(audioSrc, /windFilter\s*=\s*ctx\.createBiquadFilter\(\)/, 'Wind must use BiquadFilterNode');
  assert.match(audioSrc, /windFilter\.type\s*=\s*['"]lowpass['"]/, 'Wind filter must be lowpass');
  assert.match(audioSrc, /windLfo\.connect\(windLfoGain\)/, 'Wind LFO must connect to gain');
  assert.match(audioSrc, /windLfoGain\.connect\(windFilter\.frequency\)/, 'Wind LFO must modulate filter frequency');

  const audio = require('./audio.js');
  assert.strictEqual(typeof audio.startWind, 'function');
  assert.strictEqual(typeof audio.stopWind, 'function');
  assert.strictEqual(typeof audio.isWindActive, 'function');
});

test('js/audio.js note accepts configurable ADSR envelopes and shapes amplitude', () => {
  const audioSrc = fs.readFileSync(AUDIO_JS_PATH, 'utf8');
  assert.match(audioSrc, /opts\.adsr/, 'note must check opts.adsr');
  assert.match(audioSrc, /linearRampToValueAtTime\(gain,\s*tPeak\)/, 'ADSR must ramp to peak gain during attack');
  assert.match(audioSrc, /linearRampToValueAtTime\(sGain,\s*tSustain\)/, 'ADSR must ramp to sustain level during decay');
  assert.match(audioSrc, /exponentialRampToValueAtTime\(0\.0001,\s*tEnd\)/, 'ADSR must ramp down to zero during release');

  const audio = require('./audio.js');
  assert.strictEqual(typeof audio.note, 'function');
  assert.strictEqual(typeof audio.pad, 'function');

  function computeAdsrTiming(dur, adsr) {
    var a = Math.max(0.001, adsr.a || 0.008);
    var d = Math.max(0.001, adsr.d || 0.08);
    var s = adsr.s !== undefined ? adsr.s : 0.7;
    var r = Math.max(0.001, adsr.r || 0.3);
    var hold = Math.max(0, dur - a - d - r);
    return {
      attackDur: a,
      decayDur: d,
      sustainRatio: s,
      holdDur: hold,
      releaseDur: r,
      totalDur: a + d + hold + r
    };
  }

  var padEnvelope = computeAdsrTiming(2.4, { a: 0.6, d: 0.4, s: 0.7, r: 1.0 });
  assert.strictEqual(padEnvelope.attackDur, 0.6);
  assert.strictEqual(padEnvelope.decayDur, 0.4);
  assert.strictEqual(padEnvelope.sustainRatio, 0.7);
  assert.strictEqual(padEnvelope.releaseDur, 1.0);
  assert.ok(padEnvelope.totalDur >= 2.4);

  var bellEnvelope = computeAdsrTiming(1.6, { a: 0.005, d: 0.15, s: 0.25, r: 0.9 });
  assert.strictEqual(bellEnvelope.attackDur, 0.005);
  assert.strictEqual(bellEnvelope.decayDur, 0.15);
  assert.strictEqual(bellEnvelope.sustainRatio, 0.25);
  assert.strictEqual(bellEnvelope.releaseDur, 0.9);
});

test('ambient sound level setter clamps boundaries [0, 1]', () => {
  const audio = require('./audio.js');
  assert.strictEqual(typeof audio.setAmbientLevel, 'function');
  assert.strictEqual(typeof audio.getAmbientLevel, 'function');

  audio.setAmbientLevel(0.4);
  assert.strictEqual(audio.getAmbientLevel(), 0.4);

  audio.setAmbientLevel(-0.25);
  assert.strictEqual(audio.getAmbientLevel(), 0);

  audio.setAmbientLevel(1.5);
  assert.strictEqual(audio.getAmbientLevel(), 1);

  audio.setAmbientLevel(0.5);
  assert.strictEqual(audio.getAmbientLevel(), 0.5);
});

test('audio mute stops ambient generators unconditionally', () => {
  const audioSrc = fs.readFileSync(AUDIO_JS_PATH, 'utf8');

  // Verify set(next) stops ambient when sound is muted
  assert.match(audioSrc, /if\s*\(\s*next\s*!==\s*['"]on['"]\s*\)\s*\{[\s\S]*?stopAmbient\(\);/,
    'Turning sound off must call stopAmbient()');
});

test('js/toys.js hooks ambient controls and reacts to sound mute event', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /ambientRainBtn/, 'toys.js must query ambientRainBtn');
  assert.match(toysSrc, /ambientCricketsBtn/, 'toys.js must query ambientCricketsBtn');
  assert.match(toysSrc, /ambientWindBtn/, 'toys.js must query ambientWindBtn');
  assert.match(toysSrc, /ambientSlider/, 'toys.js must query ambientSlider');
  assert.match(toysSrc, /audio\.onChange\([\s\S]*?rainBtn[\s\S]*?cricketsBtn[\s\S]*?windBtn/,
    'toys.js must update ambient button states when audio mutes');
});
