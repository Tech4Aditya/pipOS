const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const MAIN_JS_PATH = path.join(ROOT_DIR, 'js', 'main.js');

test('index.html contains #shortcuts window with .win and data-foldable attributes', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Verify shortcuts section existence and core attributes
  assert.match(html, /<section\s+[^>]*id=["']shortcuts["'][^>]*>/i, '#shortcuts section must exist in index.html');
  
  const sectionMatch = html.match(/<section\s+[^>]*id=["']shortcuts["'][^>]*>/i);
  assert.ok(sectionMatch, 'shortcuts section must be found');
  const tagStr = sectionMatch[0];

  assert.match(tagStr, /class=["'][^"']*\bwin\b[^"']*["']/i, '#shortcuts must reuse the .win component class');
  assert.match(tagStr, /data-foldable/, '#shortcuts must include data-foldable attribute');
  assert.match(tagStr, /aria-labelledby=["']shortcutsTitle["']/, '#shortcuts must have aria-labelledby="shortcutsTitle"');

  // Verify window title is keys.txt
  assert.match(html, /<h2\s+[^>]*id=["']shortcutsTitle["'][^>]*>\s*keys\.txt/i,
    'Window title must be "keys.txt" with id="shortcutsTitle"');

  // Verify window body has hidden attribute initially
  assert.match(html, /<div\s+[^>]*class=["'][^"']*\bwin-body\b[^"']*["'][^>]*id=["']shortcutsBody["'][^>]*\bhidden\b[^>]*>/i,
    '#shortcutsBody must be a foldable win-body that starts hidden');
});

test('shortcuts window lists all required controls (1 to 8, arrows, Space, ?)', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Extract content of shortcuts section
  const shortcutsBlock = html.split(/id=["']shortcuts["']/i)[1].split(/<\/section>/i)[0];

  // 1 to 8 music keys
  assert.match(shortcutsBlock, /1.*to.*8/i, 'Must list 1 to 8 music keys');
  assert.match(shortcutsBlock, /music|lullaby/i, 'Must reference music box / Lullaby Lab');

  // Arrows for lantern
  assert.match(shortcutsBlock, /←|ArrowLeft|arrows/i, 'Must list arrow keys');
  assert.match(shortcutsBlock, /lantern|dark/i, 'Must reference lantern / dark nursery');

  // Space for blocks
  assert.match(shortcutsBlock, /Space/i, 'Must list Space key');
  assert.match(shortcutsBlock, /blocks|rattle/i, 'Must reference blocks / Rattle & Blocks');

  // ? key cheat sheet trigger
  assert.match(shortcutsBlock, /\?/i, 'Must list ? key to open/fold cheat sheet');
});

test('js/main.js registers ? keydown handler and guards input/textarea sinks', () => {
  const mainCode = fs.readFileSync(MAIN_JS_PATH, 'utf8');

  // Verify initShortcuts definition
  assert.match(mainCode, /function\s+initShortcuts\s*\(/, 'js/main.js must define initShortcuts function');

  // Verify listener checks for ? key
  assert.match(mainCode, /e\.key\s*===\s*['"]\?['"]/, 'initShortcuts must listen for "?" key');

  // Verify input and textarea guards
  assert.match(mainCode, /tagName\s*===\s*['"]INPUT['"]/, 'Must guard against typing in INPUT elements');
  assert.match(mainCode, /tagName\s*===\s*['"]TEXTAREA['"]/, 'Must guard against typing in TEXTAREA elements');
  assert.match(mainCode, /isContentEditable/, 'Must guard against contenteditable elements');

  // Verify safe execution registration
  assert.match(mainCode, /safe\(\s*['"]shortcuts['"]\s*,\s*initShortcuts\s*\)/,
    'main.js must safely initialize shortcuts via safe("shortcuts", initShortcuts)');
});

test('Desktop shortcuts navigation rail links to #shortcuts via keys.txt', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Verify desk-icons contains link to #shortcuts
  const deskIconsMatch = html.match(/<nav\s+[^>]*class=["'][^"']*\bdesk-icons\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  assert.ok(deskIconsMatch, 'desk-icons navigation must exist');
  const deskNav = deskIconsMatch[1];

  assert.match(deskNav, /href=["']#shortcuts["'][^>]*>[\s\S]*?keys\.txt<\/a>/i,
    'Desktop shortcuts rail must contain link to #shortcuts with keys.txt label');
});
