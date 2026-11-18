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

  // wish command
  let savedWish = null;
  global.PIP = global.PIP || {};
  global.PIP.fx = {
    saveLocalWish: function (w) { savedWish = w; }
  };
  global.PIP.stickers = {
    unlock: function () {}
  };
  try {
    const wishRes = term.executeCommand('wish Sweet dreams Pip');
    assert.ok(wishRes.ok, 'wish command must succeed without throwing');
    assert.match(wishRes.output, /Wish pinned to Midnight Wish Wall/i);
    assert.ok(savedWish, 'wish must be saved locally via saveLocalWish');
    assert.strictEqual(savedWish.n, 'terminal.exe');
    assert.strictEqual(savedWish.w, 'Sweet dreams Pip');
  } finally {
    delete global.PIP.fx;
    delete global.PIP.stickers;
  }
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
  assert.match(css, /\.term-ghost/, 'Must define .term-ghost styling');
  assert.match(css, /\.term-suggestions/, 'Must define .term-suggestions styling');
  assert.match(css, /\.term-pill/, 'Must define .term-pill styling');
});

test('autocomplete supports subcommands and parameter suggestions for theme, sound, play, and calc', () => {
  const term = require(TERM_JS_PATH);

  // theme parameter autocompletion
  const themeAll = term.autocomplete('theme ');
  assert.deepStrictEqual(themeAll, ['theme day', 'theme night', 'theme contrast']);

  const themeNight = term.autocomplete('theme n');
  assert.deepStrictEqual(themeNight, ['theme night']);

  // sound parameter autocompletion
  const soundAll = term.autocomplete('sound ');
  assert.deepStrictEqual(soundAll, ['sound on', 'sound off', 'sound toggle']);

  // play parameter autocompletion
  const playAll = term.autocomplete('play ');
  assert.deepStrictEqual(playAll, ['play chime', 'play lullaby']);

  // calc parameter autocompletion
  const calcAll = term.autocomplete('calc ');
  assert.ok(calcAll.length > 0, 'calc must offer example expressions');
  assert.ok(calcAll.some(c => c.includes('24 * 7')));
});

test('index.html provides #termGhost and #termSuggestions containers for inline hints and pills', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /id=["']termGhost["']/, 'index.html must include #termGhost for inline ghost text');
  assert.match(html, /id=["']termSuggestions["']/, 'index.html must include #termSuggestions pill container');
  assert.match(html, /class=["'][^"']*\bterm-suggestions\b[^"']*["']/, '#termSuggestions must have .term-suggestions class');
});

test('initTerminal handles Tab and Shift-Tab cycling in-place and updates cursor position at end', () => {
  const term = require(TERM_JS_PATH);

  let keydownHandler = null;
  let inputHandler = null;
  let selectionStart = -1, selectionEnd = -1;

  const mockInput = {
    value: '',
    focus() {},
    setSelectionRange(start, end) {
      selectionStart = start;
      selectionEnd = end;
    },
    addEventListener(event, fn) {
      if (event === 'keydown') keydownHandler = fn;
      if (event === 'input') inputHandler = fn;
    }
  };

  const mockGhost = { innerHTML: '' };
  const mockSuggestions = {
    innerHTML: '',
    children: [],
    classList: {
      add() {},
      remove() {}
    },
    appendChild(child) {
      this.children.push(child);
    }
  };

  const mockScreen = {
    appendChild() {},
    parentElement: {
      addEventListener() {}
    }
  };

  const mockWin = { id: 'terminal' };

  global.window = global.window || {};
  global.document = {
    readyState: 'complete',
    getElementById(id) {
      if (id === 'terminal') return mockWin;
      if (id === 'termScreen') return mockScreen;
      if (id === 'termInput') return mockInput;
      if (id === 'termGhost') return mockGhost;
      if (id === 'termSuggestions') return mockSuggestions;
      return null;
    },
    querySelector(sel) {
      return this.getElementById(sel.replace('#', ''));
    },
    querySelectorAll() {
      return [];
    },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        textContent: '',
        innerHTML: '',
        attributes: {},
        listeners: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k]; },
        appendChild(c) { this.children = this.children || []; this.children.push(c); },
        addEventListener(evt, fn) { this.listeners[evt] = fn; }
      };
      return el;
    }
  };

  try {
    term.init();
    assert.strictEqual(typeof keydownHandler, 'function', 'Must register keydown handler');

    // 1. Type "t" into input -> Tab should cycle to first candidate
    mockInput.value = 't';
    let defaultPrevented = false;
    keydownHandler({
      key: 'Tab',
      shiftKey: false,
      preventDefault() { defaultPrevented = true; }
    });
    assert.ok(defaultPrevented, 'Tab key default must be prevented');
    assert.strictEqual(mockInput.value, 'time');
    assert.strictEqual(selectionEnd, 4, 'Cursor position must be at the end of "time"');

    // 2. Press Tab again -> should cycle to "theme"
    defaultPrevented = false;
    keydownHandler({
      key: 'Tab',
      shiftKey: false,
      preventDefault() { defaultPrevented = true; }
    });
    assert.strictEqual(mockInput.value, 'theme');
    assert.strictEqual(selectionEnd, 5, 'Cursor position must be at the end of "theme"');

    // 3. Shift+Tab -> should cycle backwards back to "time"
    keydownHandler({
      key: 'Tab',
      shiftKey: true,
      preventDefault() {}
    });
    assert.strictEqual(mockInput.value, 'time');
    assert.strictEqual(selectionEnd, 4, 'Cursor position must be at the end after Shift-Tab');

    // 4. Tab cycling on subcommands: "theme "
    mockInput.value = 'theme ';
    keydownHandler({
      key: 'Tab',
      shiftKey: false,
      preventDefault() {}
    });
    assert.strictEqual(mockInput.value, 'theme day');
    assert.strictEqual(selectionEnd, 9, 'Cursor position must be at the end of "theme day"');

    keydownHandler({
      key: 'Tab',
      shiftKey: false,
      preventDefault() {}
    });
    assert.strictEqual(mockInput.value, 'theme night');
    assert.strictEqual(selectionEnd, 11, 'Cursor position must be at the end of "theme night"');
  } finally {
    delete global.document;
  }
});

test('ArrowUp and ArrowDown navigate cmdHistory with pending buffer restoration and cursor positioning', () => {
  const term = require(TERM_JS_PATH);
  term.setHistory(['whoami', 'theme night', 'calc 42 * 2']);

  let keydownHandler = null;
  let selectionEnd = null;
  const mockInput = {
    value: '',
    focus() {},
    setSelectionRange(start, end) { selectionEnd = end; },
    addEventListener(evt, fn) {
      if (evt === 'keydown') keydownHandler = fn;
    }
  };
  const mockScreen = {
    appendChild() {},
    scrollTop: 0,
    scrollHeight: 100,
    parentElement: { addEventListener() {} }
  };
  const mockWin = {
    parentElement: { addEventListener() {} }
  };
  const mockGhost = { innerHTML: '' };
  const mockSuggestions = {
    innerHTML: '',
    classList: { add() {}, remove() {} },
    appendChild() {}
  };

  const mockDoc = {
    readyState: 'complete',
    getElementById(id) {
      if (id === 'terminal') return mockWin;
      if (id === 'termScreen') return mockScreen;
      if (id === 'termInput') return mockInput;
      if (id === 'termGhost') return mockGhost;
      if (id === 'termSuggestions') return mockSuggestions;
      return null;
    },
    querySelector(sel) {
      return this.getElementById(sel.replace('#', ''));
    },
    querySelectorAll() { return []; },
    createElement() {
      return {
        className: '',
        textContent: '',
        setAttribute() {},
        appendChild() {},
        addEventListener() {}
      };
    }
  };

  global.document = mockDoc;
  try {
    term.init();
    assert.strictEqual(typeof keydownHandler, 'function');

    // User types pending text
    mockInput.value = 'my unfinished input';

    // 1. ArrowUp -> should save pending input and recall newest command ('calc 42 * 2')
    keydownHandler({ key: 'ArrowUp', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'calc 42 * 2');
    assert.strictEqual(selectionEnd, 'calc 42 * 2'.length);

    // 2. ArrowUp -> recall previous command ('theme night')
    keydownHandler({ key: 'ArrowUp', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'theme night');
    assert.strictEqual(selectionEnd, 'theme night'.length);

    // 3. ArrowUp -> recall oldest command ('whoami')
    keydownHandler({ key: 'ArrowUp', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'whoami');

    // 4. ArrowUp at boundary -> stays at oldest command
    keydownHandler({ key: 'ArrowUp', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'whoami');

    // 5. ArrowDown -> cycle forward to 'theme night'
    keydownHandler({ key: 'ArrowDown', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'theme night');

    // 6. ArrowDown -> cycle forward to 'calc 42 * 2'
    keydownHandler({ key: 'ArrowDown', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'calc 42 * 2');

    // 7. ArrowDown past newest command -> restore pending buffer
    keydownHandler({ key: 'ArrowDown', preventDefault() {} });
    assert.strictEqual(mockInput.value, 'my unfinished input');
    assert.strictEqual(selectionEnd, 'my unfinished input'.length);
  } finally {
    delete global.document;
  }
});
