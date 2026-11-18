const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');
const TERM_JS_PATH = path.join(ROOT_DIR, 'js', 'terminal.js');

test('index.html contains #crtBtn taskbar toggle with accessible attributes', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const btnMatch = html.match(/<button[^>]*\bid=["']crtBtn["'][^>]*>/i);
  assert.ok(btnMatch, 'Must include taskbar button with id="crtBtn"');
  const btnTag = btnMatch[0];
  assert.ok(btnTag.includes('class="tb-btn"'), 'Must have class="tb-btn"');
  assert.ok(btnTag.includes('aria-pressed="false"'), 'Must have aria-pressed attribute initially');
  assert.match(btnTag, /aria-label=["'][^"']*CRT[^"']*["']/i, 'Must have accessible aria-label');
  assert.match(html, /<span\s+id=["']crtLabel["']>CRT<\/span>/i, 'Must have #crtLabel element');
});

test('css/style.css defines body.crt-active::after overlay and reduced-motion override', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /body\.crt-active::after\s*\{/i, 'Must define body.crt-active::after overlay rule');
  assert.match(css, /repeating-linear-gradient/i, 'Must use repeating-linear-gradient for scanlines');
  assert.match(css, /pointer-events:\s*none/i, 'Must ensure pointer-events: none so clicks pass through');
  assert.match(css, /box-shadow:[^;]*inset/i, 'Must include subtle vignette inset box shadow');
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i, 'Must include reduced-motion guard');
});

test('terminal crt command enables, disables, and toggles CRT scanline mode', () => {
  const term = require(TERM_JS_PATH);
  assert.ok(term.COMMANDS.includes('crt'), 'COMMANDS must include crt');

  let crtState = false;
  let stored = {};
  global.PIP = {
    crt: {
      isOn: () => crtState,
      toggle: () => { crtState = !crtState; return crtState; },
      set: (val) => { crtState = Boolean(val); }
    },
    store: {
      get: (k, d) => stored[k] !== undefined ? stored[k] : d,
      set: (k, v) => { stored[k] = v; }
    }
  };

  try {
    // 1. crt on
    const onRes = term.executeCommand('crt on');
    assert.ok(onRes.ok);
    assert.match(onRes.output, /CRT scanline & phosphor bloom effect enabled/i);
    assert.strictEqual(crtState, true);

    // 2. crt off
    const offRes = term.executeCommand('crt off');
    assert.ok(offRes.ok);
    assert.match(offRes.output, /CRT scanline effect disabled/i);
    assert.strictEqual(crtState, false);

    // 3. crt toggle
    const toggleRes = term.executeCommand('crt toggle');
    assert.ok(toggleRes.ok);
    assert.match(toggleRes.output, /CRT scanline & phosphor bloom effect enabled/i);
    assert.strictEqual(crtState, true);

    // 4. autocomplete for crt
    const matches = term.autocomplete('cr');
    assert.deepStrictEqual(matches, ['crt']);
  } finally {
    delete global.PIP;
  }
});
