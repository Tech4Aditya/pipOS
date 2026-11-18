const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const TOYS_JS_PATH = path.resolve(__dirname, 'toys.js');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');

test('index.html contains #storySpeechBtn inside #storybook .win-bar with 🎙️ Read to Me', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Verify #storybook .win-bar contains storySpeechBtn
  const winBarMatch = html.match(/<article[^>]*id=["']storybook["'][\s\S]*?<div class=["']win-bar["']>([\s\S]*?)<\/div>/i);
  assert.ok(winBarMatch, '#storybook must contain .win-bar');

  const winBarContent = winBarMatch[1];
  assert.match(winBarContent, /id=["']storySpeechBtn["']/, '.win-bar must contain #storySpeechBtn');
  assert.match(winBarContent, /🎙️\s*Read to Me/, '#storySpeechBtn must contain "🎙️ Read to Me" label');

  // Verify no duplicate IDs
  const idMatches = html.match(/id=["']storySpeechBtn["']/g);
  assert.strictEqual(idMatches.length, 1, 'storySpeechBtn ID must be unique in index.html');
});

test('css/style.css defines layout and whitespace styling for #storySpeechBtn', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /#storySpeechBtn\s*\{[^}]*margin-left:\s*auto/, 'Must align #storySpeechBtn in title bar');
});

test('js/toys.js implements and exports narrateStoryPage with correct rate and pitch', () => {
  const toys = require('./toys.js');
  assert.strictEqual(typeof toys.narrateStoryPage, 'function', 'toys.js must export narrateStoryPage');

  let cancelled = false;
  let spokenUtterance = null;

  const mockSynth = {
    cancel() {
      cancelled = true;
    },
    speak(utterance) {
      spokenUtterance = utterance;
    }
  };

  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
    }
  }

  global.SpeechSynthesisUtterance = MockUtterance;

  const mockElement = {
    querySelector(sel) {
      if (sel === 'h4') return { textContent: 'The Midnight Basket' };
      if (sel === 'p') return { textContent: 'A wicker basket floated through the nursery fog.' };
      return null;
    }
  };

  const utt = toys.narrateStoryPage(mockElement, mockSynth);
  assert.ok(cancelled, 'narrateStoryPage must cancel ongoing speech first');
  assert.ok(utt, 'narrateStoryPage must return created utterance');
  assert.strictEqual(utt.rate, 0.82, 'Utterance rate must be set to 0.82');
  assert.strictEqual(utt.pitch, 1.1, 'Utterance pitch must be set to 1.1');
  assert.strictEqual(utt.text, 'The Midnight Basket. A wicker basket floated through the nursery fog.');
  assert.strictEqual(spokenUtterance, utt, 'synth.speak must be invoked with utterance');

  delete global.SpeechSynthesisUtterance;
});

test('js/toys.js initStorybook checks speechSynthesis and sets rate: 0.82, pitch: 1.1', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /'speechSynthesis'\s+in\s+window/, 'Must check speechSynthesis in window');
  assert.match(toysSrc, /speechSynthesis\.cancel\(\)/, 'Must cancel active speech before speaking');
  assert.match(toysSrc, /new\s+SpeechSynthesisUtterance\(/, 'Must construct SpeechSynthesisUtterance');
  assert.match(toysSrc, /rate\s*=\s*0\.82/, 'Must set rate to 0.82');
  assert.match(toysSrc, /pitch\s*=\s*1\.1/, 'Must set pitch to 1.1');
  assert.match(toysSrc, /speechSynthesis\.speak\(/, 'Must invoke speechSynthesis.speak');
});
