const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const TOYS_JS_PATH = path.resolve(__dirname, 'toys.js');
const CSS_PATH = path.resolve(__dirname, '..', 'css', 'style.css');

test('index.html contains storybook.exe window in Work section', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<article[^>]*id=["']storybook["'][^>]*class=["'][^"']*w-flipbook[^"']*["']/i,
    'Work section must include storybook article');
  assert.match(html, /storybook\.exe/i, 'Storybook window title must be storybook.exe');
  assert.match(html, /id=["']book["'][^>]*role=["']region["']/i, 'Flipbook container must have role="region"');
  assert.match(html, /id=["']bookPrev["']/i, 'Previous page button must exist');
  assert.match(html, /id=["']bookNext["']/i, 'Next page button must exist');
  assert.match(html, /id=["']bookInd["']/i, 'Page indicator must exist');
});

test('storybook.exe has exactly 6 illustrated pages with concise micro-stories', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const pageMatches = html.match(/<article[^>]*class=["'][^"']*book-page[^"']*["']/g);
  assert.ok(pageMatches, 'Storybook must contain book-page elements');
  assert.strictEqual(pageMatches.length, 6, 'Storybook must have exactly 6 illustrated pages');

  // Verify page titles
  assert.match(html, /The Midnight Basket/i);
  assert.match(html, /The Stolen Star/i);
  assert.match(html, /Mixing Lantern Honey/i);
  assert.match(html, /Rooftop Wind Secrets/i);
  assert.match(html, /The Sock Detective/i);
  assert.match(html, /Goodnight, Little Dreamer/i);

  // Verify every page contains an inline SVG illustration
  const svgMatches = html.match(/<div class=["']bp-art["']>\s*<svg/g);
  assert.ok(svgMatches && svgMatches.length >= 6, 'Every story page must have an inline SVG illustration');
});

test('js/toys.js implements initStorybook with arrow keys and touch swipe support', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  assert.match(toysSrc, /function\s+initStorybook\s*\(/, 'toys.js must define initStorybook');
  assert.match(toysSrc, /initStorybook\(\)/, 'PIP.toys.init must call initStorybook()');
  assert.match(toysSrc, /touchstart/, 'Flipbook must register touchstart listener for swiping');
  assert.match(toysSrc, /touchend/, 'Flipbook must register touchend listener for swiping');
  assert.match(toysSrc, /ArrowRight|ArrowLeft/, 'Flipbook must support arrow key navigation');
});

test('css/style.css defines responsive grid and reduced-motion overrides for storybook', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.match(css, /\.w-flipbook\s*\{\s*grid-column:\s*span\s+12;/,
    '.w-flipbook must span all 12 grid columns');
  assert.match(css, /\.book-page\s*\{[^}]*display:\s*grid;/,
    '.book-page must be a styled grid layout');
  assert.match(css, /\.book-page\s*\{[^}]*transition:/,
    '.book-page must have smooth page-flip transition');
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.book-page/,
    'Reduced motion media query must override .book-page transition');
});

test('js/toys.js guards speech synthesis interactions and handles utterance errors (Fixes #227)', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

  // Must guard stopSpeech with speechSynthesis check
  assert.match(toysSrc, /if\s*\(\s*['"]speechSynthesis['"]\s+in\s+window\s*&&\s*window\.speechSynthesis\s*\)\s*window\.speechSynthesis\.cancel\(\)/,
    'stopSpeech must guard speechSynthesis in window before cancelling');

  // Must handle utterance error event
  assert.match(toysSrc, /utterance\.onerror\s*=/, 'utterance must handle onerror event');

  // Must guard pauseBtn listener with speechSynthesis check
  assert.match(toysSrc, /pauseBtn[\s\S]*!window\.speechSynthesis\s*\)\s*return/, 'pauseBtn must guard against missing window.speechSynthesis');
});
