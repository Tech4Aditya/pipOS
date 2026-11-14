const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const fx = require('./fx.js');
const wall = require('./wall.js');

/* =========================================================================
   Mock DOM Document for verifying textContent vs innerHTML DOM rendering
   ========================================================================= */
function createMockDocument() {
  function MockElement(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.className = '';
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this._textContent = '';
  }

  Object.defineProperty(MockElement.prototype, 'textContent', {
    get() {
      return this._textContent;
    },
    set(value) {
      // Setting textContent clears any child nodes and sets raw text (safe from HTML injection)
      this.children = [];
      this._textContent = String(value);
    }
  });

  Object.defineProperty(MockElement.prototype, 'innerHTML', {
    get() {
      // In real DOM engines, reading innerHTML of an element populated via textContent
      // returns HTML-entity-escaped text (& -> &amp;, < -> &lt;, > -> &gt;, etc.)
      return this._textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    set(value) {
      // If innerHTML were erroneously used, tags would parse into child DOM elements (unsafe!)
      this.children = [];
      const tagRegex = /<([a-z0-9-]+)[^>]*>/gi;
      let match;
      while ((match = tagRegex.exec(value)) !== null) {
        this.children.push(new MockElement(match[1]));
      }
      this._textContent = value.replace(/<[^>]*>/g, '');
    }
  });

  MockElement.prototype.appendChild = function (child) {
    this.children.push(child);
    return child;
  };

  MockElement.prototype.getElementsByTagName = function (tagName) {
    const results = [];
    const target = tagName.toUpperCase();
    function search(node) {
      for (const child of node.children) {
        if (child.tagName === target) results.push(child);
        search(child);
      }
    }
    search(this);
    return results;
  };

  return {
    createElement(tag) {
      return new MockElement(tag);
    }
  };
}

/* =========================================================================
   1. Content Security Policy (CSP) Meta Tag Tests
   ========================================================================= */
test('index.html contains a strict, valid Content-Security-Policy meta tag', () => {
  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify CSP meta tag exists in head
  const cspMatch = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]+)"/i);
  assert.ok(cspMatch, 'CSP meta tag must be present in index.html');

  const policy = cspMatch[1];

  // default-src 'self'
  assert.match(policy, /default-src\s+[^;]*'self'/, 'default-src must permit "self"');

  // script-src permits 'self' and 'unsafe-inline' (for head script / backend config)
  assert.match(policy, /script-src\s+[^;]*'self'/, 'script-src must permit "self"');
  assert.match(policy, /script-src\s+[^;]*'unsafe-inline'/, 'script-src must permit "unsafe-inline"');

  // style-src permits 'self', 'unsafe-inline', and Google Fonts CSS
  assert.match(policy, /style-src\s+[^;]*'self'/, 'style-src must permit "self"');
  assert.match(policy, /style-src\s+[^;]*'unsafe-inline'/, 'style-src must permit "unsafe-inline" for dynamic styles');
  assert.match(policy, /style-src\s+[^;]*https:\/\/fonts\.googleapis\.com/, 'style-src must permit Google Fonts CSS');

  // font-src permits 'self' and Google Fonts static woff2
  assert.match(policy, /font-src\s+[^;]*'self'/, 'font-src must permit "self"');
  assert.match(policy, /font-src\s+[^;]*https:\/\/fonts\.gstatic\.com/, 'font-src must permit Google Fonts assets');

  // img-src permits 'self', data:, blob:
  assert.match(policy, /img-src\s+[^;]*'self'/, 'img-src must permit "self"');
  assert.match(policy, /img-src\s+[^;]*data:/, 'img-src must permit data: URLs');

  // connect-src permits 'self' and shared backend endpoints (Firebase, Supabase)
  assert.match(policy, /connect-src\s+[^;]*'self'/, 'connect-src must permit "self"');
  assert.match(policy, /connect-src\s+[^;]*https:\/\/\*\.firebaseio\.com/, 'connect-src must permit Firebase Realtime DB');
  assert.match(policy, /connect-src\s+[^;]*https:\/\/\*\.supabase\.co/, 'connect-src must permit Supabase endpoints');

  // object-src 'none' (blocks plugin execution)
  assert.match(policy, /object-src\s+'none'/, 'object-src must be "none"');

  // base-uri 'self'
  assert.match(policy, /base-uri\s+'self'/, 'base-uri must be "self"');

  // Directives disallowed in <meta> (avoid browser console warnings)
  assert.doesNotMatch(policy, /frame-ancestors/, 'frame-ancestors is disallowed in <meta> and triggers console warnings');
  assert.doesNotMatch(policy, /report-uri/, 'report-uri is disallowed in <meta>');
  assert.doesNotMatch(policy, /report-to/, 'report-to is disallowed in <meta>');
});

/* =========================================================================
   2. Static Security Audit: Ensure No Unsafe Sinks on Dynamic Inputs
   ========================================================================= */
test('js/fx.js and js/wall.js never use innerHTML, outerHTML, document.write, or eval on user inputs', () => {
  const fxSrc = fs.readFileSync(path.resolve(__dirname, 'fx.js'), 'utf8');
  const wallSrc = fs.readFileSync(path.resolve(__dirname, 'wall.js'), 'utf8');

  // Neither file should contain eval or document.write
  assert.doesNotMatch(fxSrc, /\beval\s*\(/, 'js/fx.js must not contain eval()');
  assert.doesNotMatch(wallSrc, /\beval\s*\(/, 'js/wall.js must not contain eval()');
  assert.doesNotMatch(fxSrc, /document\.write/, 'js/fx.js must not contain document.write');
  assert.doesNotMatch(wallSrc, /document\.write/, 'js/wall.js must not contain document.write');

  // outerHTML should never be used
  assert.doesNotMatch(fxSrc, /\.outerHTML/, 'js/fx.js must not use outerHTML');
  assert.doesNotMatch(wallSrc, /\.outerHTML/, 'js/wall.js must not use outerHTML');

  // In js/fx.js, wishes and names must be rendered via textContent
  assert.match(fxSrc, /p\.textContent\s*=\s*(?:x\.w|\(x\s*&&\s*typeof\s*x\.w)/, 'Wish text must be set via textContent');
  assert.match(fxSrc, /by\.textContent\s*=\s*(?:x\.n|\(x\s*&&\s*typeof\s*x\.n)/, 'Author name must be set via textContent');
});

/* =========================================================================
   3. Automated XSS Payload Tests: Proving HTML Injection is Impossible
   ========================================================================= */
const XSS_PAYLOADS = [
  { name: 'Standard script tag', payload: '<script>alert("XSS")</script>' },
  { name: 'Image with onerror handler', payload: '<img src="x" onerror="evil()">' },
  { name: 'SVG with onload handler', payload: '<svg onload="evil()">' },
  { name: 'Iframe with javascript URI', payload: '<iframe src="javascript:evil()"></iframe>' },
  { name: 'Closing tag breakout', payload: '"><script>alert(1)</script>' },
  { name: 'Event handler attribute injection', payload: '" onfocus="evil()" autofocus="' },
  { name: 'Body onload attempt', payload: '<body onload="evil()">' },
  { name: 'Style injection attempt', payload: '<style>body{display:none}</style>' },
  { name: 'Hyperlink javascript URI', payload: '<a href="javascript:alert(1)">Click</a>' },
  { name: 'Object/Flash plugin embed', payload: '<object data="evil.swf"></object>' },
  { name: 'Details ontoggle execution', payload: '<details open ontoggle="alert(1)">' },
  { name: 'Audio onerror injection', payload: '<audio src="1" onerror="alert(1)">' },
  { name: 'Video onerror injection', payload: '<video><source onerror="alert(1)"></video>' },
  { name: 'Null-byte prefixed script', payload: '\u0000<script>alert("XSS")</script>' }
];

test('createNoteElement renders all XSS payloads safely as plain text without DOM element creation', () => {
  const mockDoc = createMockDocument();
  const dangerousTags = ['script', 'img', 'svg', 'iframe', 'body', 'style', 'a', 'object', 'details', 'audio', 'video'];

  XSS_PAYLOADS.forEach(({ name, payload }) => {
    // Test payload injected as wish text
    const wishNote = fx.createNoteElement({ w: payload, n: 'Sleepy Hacker' }, 0, mockDoc);
    assert.ok(wishNote, `Failed to create note for payload: ${name}`);

    // Verify no child elements were parsed inside p or span
    assert.strictEqual(wishNote.children.length, 2, 'Note must only contain exactly <p> and <span>');
    const pEl = wishNote.children[0];
    const spanEl = wishNote.children[1];

    assert.strictEqual(pEl.children.length, 0, `p element must have 0 child elements for ${name}`);
    assert.strictEqual(spanEl.children.length, 0, `span element must have 0 child elements for ${name}`);

    // Verify none of the dangerous tags exist in the generated DOM subtree
    dangerousTags.forEach(tag => {
      const elements = wishNote.getElementsByTagName(tag);
      assert.strictEqual(elements.length, 0, `Injected <${tag}> tag must not produce DOM elements for ${name}`);
    });

    // Verify textContent preserves the exact literal payload string
    assert.strictEqual(pEl.textContent, payload, `p.textContent must store literal string for ${name}`);

    // Verify reading innerHTML yields properly escaped HTML entities
    assert.doesNotMatch(pEl.innerHTML, /<script|<img|<svg|<iframe|<body|<style|<object/i,
      `p.innerHTML must escape angle brackets for ${name}`);

    // Test payload injected as author name
    const authorNote = fx.createNoteElement({ w: 'Sweet dreams', n: payload }, 1, mockDoc);
    const authorSpan = authorNote.children[1];
    assert.strictEqual(authorSpan.children.length, 0, `author span must have 0 child elements for ${name}`);
    assert.strictEqual(authorSpan.textContent, payload, `author span textContent must store literal string for ${name}`);

    dangerousTags.forEach(tag => {
      assert.strictEqual(authorNote.getElementsByTagName(tag).length, 0,
        `Injected author <${tag}> tag must not produce DOM elements for ${name}`);
    });
  });
});

/* =========================================================================
   4. End-to-End Validation + Sanitization + Rendering Pipeline
   ========================================================================= */
test('Full wish submission pipeline safely sanitizes and renders malicious input', () => {
  const mockDoc = createMockDocument();
  const dirtyWish = '<script>alert("hacked")</script>\u0000\u200B';
  const dirtyName = '<b onfocus=1>Pip</b>\uFEFF';

  // Step 1: Input validation & sanitization
  const validation = wall.validateWish(dirtyWish, dirtyName);
  assert.strictEqual(validation.ok, true);

  // Control characters stripped
  assert.strictEqual(validation.wish.includes('\u0000'), false);
  assert.strictEqual(validation.wish.includes('\u200B'), false);
  assert.strictEqual(validation.name.includes('\uFEFF'), false);

  // Payload content preserved as literal text
  assert.strictEqual(validation.wish, '<script>alert("hacked")</script>');
  assert.strictEqual(validation.name, '<b onfocus=1>Pip</b>');

  // Step 2: DOM Rendering via createNoteElement
  const note = fx.createNoteElement({ w: validation.wish, n: validation.name }, 0, mockDoc);
  const p = note.children[0];
  const by = note.children[1];

  // Step 3: Verify safe DOM structure
  assert.strictEqual(p.children.length, 0);
  assert.strictEqual(by.children.length, 0);
  assert.strictEqual(note.getElementsByTagName('script').length, 0);
  assert.strictEqual(note.getElementsByTagName('b').length, 0);
  assert.strictEqual(p.textContent, '<script>alert("hacked")</script>');
  assert.strictEqual(by.textContent, '<b onfocus=1>Pip</b>');
});
