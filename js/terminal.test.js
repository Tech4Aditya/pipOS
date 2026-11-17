const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const TERM_JS_PATH = path.join(ROOT_DIR, 'js', 'terminal.js');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');

test('js/terminal.js exports valid terminal API with executeCommand and autocomplete', () => {
  assert.ok(fs.existsSync(TERM_JS_PATH), 'js/terminal.js must exist');
  const term = require(TERM_JS_PATH);

  assert.strictEqual(typeof term.executeCommand, 'function', 'executeCommand must be a function');
  assert.strictEqual(typeof term.autocomplete, 'function', 'autocomplete must be a function');
  assert.ok(Array.isArray(term.COMMANDS), 'COMMANDS must be an array');
  assert.ok(term.COMMANDS.includes('help'), 'Must include help');
  assert.ok(term.COMMANDS.includes('whoami'), 'Must include whoami');
  assert.ok(term.COMMANDS.includes('theme'), 'Must include theme');
});

test('terminal command execution returns expected outputs for help, whoami, and calc', () => {
  const term = require(TERM_JS_PATH);

  const helpRes = term.executeCommand('help');
  assert.ok(helpRes.ok, 'help command must succeed');
  assert.match(helpRes.output, /Midnight Shell v1\.0/i);

  const whoRes = term.executeCommand('whoami');
  assert.match(whoRes.output, /Pip the Skull Baby/i);

  // calc 15 * 4
  const calcRes = term.executeCommand('calc 15 * 4');
  assert.match(calcRes.output, /60/);

  // calc division by zero
  const divZero = term.executeCommand('calc 10 / 0');
  assert.match(divZero.output, /Error \(÷ 0\)/);
});

test('tab autocompletion returns matching command candidates', () => {
  const term = require(TERM_JS_PATH);

  const thMatches = term.autocomplete('th');
  assert.deepStrictEqual(thMatches, ['theme']);

  const whMatches = term.autocomplete('wh');
  assert.ok(whMatches.includes('whoami'));

  const emptyMatches = term.autocomplete('xyz123');
  assert.deepStrictEqual(emptyMatches, []);
});

test('terminal theme command guards against toggle button inversion when target matches current', () => {
  const term = require(TERM_JS_PATH);

  let clicked = false;
  const mockBtn = {
    click() { clicked = true; }
  };
  const mockDoc = {
    getElementById(id) {
      if (id === 'themeBtn') return mockBtn;
      return null;
    },
    documentElement: {
      getAttribute(attr) {
        if (attr === 'data-theme') return 'night';
        return null;
      },
      setAttribute() {}
    }
  };

  global.document = mockDoc;
  try {
    // When current is 'night' and user enters 'theme night', themeBtn.click must NOT be called
    clicked = false;
    const resSame = term.executeCommand('theme night');
    assert.strictEqual(clicked, false, 'themeBtn must not be clicked if theme already matches target');
    assert.match(resSame.output, /Theme switched to night mode/);

    // When current is 'night' and user enters 'theme day', themeBtn.click MUST be called
    clicked = false;
    const resDiff = term.executeCommand('theme day');
    assert.strictEqual(clicked, true, 'themeBtn must be clicked to toggle when target is different');
    assert.match(resDiff.output, /Theme switched to day mode/);
  } finally {
    delete global.document;
  }
});

test('index.html contains #terminal article window in #work section with CRT screen and prompt', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<article\s+[^>]*id=["']terminal["'][^>]*>/i, '#terminal article must exist in index.html');
  assert.match(html, /class=["'][^"']*\bw-term\b[^"']*["']/i, '#terminal must have w-term class');
  assert.match(html, /id=["']termTitle["']>\s*pip-term\.exe/i, 'Window title must be pip-term.exe');

  assert.match(html, /id=["']termScreen["']/, 'Must provide terminal screen output container');
  assert.match(html, /id=["']termInput["']/, 'Must provide terminal command input field');

  assert.match(html, /<a\s+[^>]*href=["']#terminal["'][^>]*>.*terminal\.exe/is, 'Must include desktop icon link for terminal.exe');
});

test('css/style.css defines styling for CRT terminal, prompt, and scanline look', () => {
  assert.ok(fs.existsSync(CSS_PATH), 'css/style.css must exist');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.w-term/, 'Must define .w-term styling');
  assert.match(css, /\.term-box/, 'Must define .term-box container');
  assert.match(css, /\.term-screen/, 'Must define .term-screen styling');
  assert.match(css, /\.term-input/, 'Must define .term-input styling');
});
