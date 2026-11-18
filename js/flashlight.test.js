const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const flashlightModule = require('./flashlight.js');

test('Night Flashlight: API contract', () => {
  assert.strictEqual(typeof flashlightModule.init, 'function', 'init must be a function');
  assert.strictEqual(typeof flashlightModule.toggle, 'function', 'toggle must be a function');
  assert.strictEqual(typeof flashlightModule.setEnabled, 'function', 'setEnabled must be a function');
  assert.strictEqual(typeof flashlightModule.isEnabled, 'function', 'isEnabled must be a function');
  assert.strictEqual(typeof flashlightModule.setPosition, 'function', 'setPosition must be a function');
  assert.strictEqual(typeof flashlightModule.setRadius, 'function', 'setRadius must be a function');
  assert.strictEqual(typeof flashlightModule.getState, 'function', 'getState must be a function');
});

test('Night Flashlight: off by default', () => {
  flashlightModule.setEnabled(false);
  assert.strictEqual(flashlightModule.isEnabled(), false, 'Flashlight must be off by default');
  const state = flashlightModule.getState();
  assert.strictEqual(state.enabled, false);
});

test('Night Flashlight: toggle and setEnabled state management', () => {
  flashlightModule.setEnabled(false);
  assert.strictEqual(flashlightModule.isEnabled(), false);

  const toggledOn = flashlightModule.toggle();
  assert.strictEqual(toggledOn, true);
  assert.strictEqual(flashlightModule.isEnabled(), true);

  const toggledOff = flashlightModule.toggle();
  assert.strictEqual(toggledOff, false);
  assert.strictEqual(flashlightModule.isEnabled(), false);

  flashlightModule.setEnabled(true);
  assert.strictEqual(flashlightModule.isEnabled(), true);
  flashlightModule.setEnabled(false);
  assert.strictEqual(flashlightModule.isEnabled(), false);
});

test('Night Flashlight: position and radius updates', () => {
  flashlightModule.setPosition(250, 400);
  flashlightModule.setRadius(180);
  const state = flashlightModule.getState();
  assert.strictEqual(state.x, 250);
  assert.strictEqual(state.y, 400);
  assert.strictEqual(state.radius, 180);
});

test('Night Flashlight: index.html DOM structure and accessibility attributes', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Flashlight overlay exists, is hidden by default, and accessible to screen readers
  assert.match(html, /<div\s+[^>]*id=["']flashlightOverlay["'][^>]*hidden/i, 'flashlightOverlay must exist and start hidden');
  assert.match(html, /<div\s+[^>]*id=["']flashlightOverlay["'][^>]*aria-hidden=["']true["']/i, 'flashlightOverlay must have aria-hidden="true"');
  assert.match(html, /<div\s+[^>]*id=["']flashlightOverlay["'][^>]*role=["'](presentation|none)["']/i, 'flashlightOverlay must have role="none" or role="presentation"');

  // Flashlight glow exists
  assert.match(html, /<div\s+[^>]*id=["']flashlightGlow["'][^>]*hidden/i, 'flashlightGlow must exist and start hidden');
  assert.match(html, /<div\s+[^>]*id=["']flashlightGlow["'][^>]*aria-hidden=["']true["']/i, 'flashlightGlow must have aria-hidden="true"');

  // Toggle button in header / taskbar tray
  assert.match(html, /<button\s+[^>]*id=["']flashlightBtn["'][^>]*aria-pressed=["']false["']/i, 'flashlightBtn must start with aria-pressed="false"');
  assert.match(html, /<button\s+[^>]*id=["']flashlightBtn["'][^>]*aria-label=["']Night flashlight off, turn it on["']/i, 'flashlightBtn must have descriptive aria-label');

  // Script loaded with defer
  assert.match(html, /<script\s+[^>]*src=["']js\/flashlight\.js["'][^>]*defer/i, 'js/flashlight.js must be loaded with defer');
});

test('Night Flashlight: css/style.css non-blocking pointer events, reduced motion, and high contrast', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

  // Pointer events none ensures keyboard & mouse clicks pass through completely
  assert.match(css, /\.flashlight-overlay\s*\{[^}]*pointer-events:\s*none/i, 'Overlay must have pointer-events: none');
  assert.match(css, /\.flashlight-glow\s*\{[^}]*pointer-events:\s*none/i, 'Glow must have pointer-events: none');

  // CSS variables defined on root
  assert.match(css, /--fl-x:\s*50vw/, '--fl-x default must be defined in :root');
  assert.match(css, /--fl-y:\s*50vh/, '--fl-y default must be defined in :root');
  assert.match(css, /--fl-r:\s*160px/, '--fl-r default must be defined in :root');

  // High contrast mode support
  assert.match(css, /\[data-theme=["']contrast["']\]\s+\.flashlight-overlay/, 'Must style flashlight for high contrast mode');

  // Reduced motion support
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.flashlight-overlay/, 'Must support prefers-reduced-motion');
});

test('Night Flashlight: sw.js pre-caches js/flashlight.js', () => {
  const swCode = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(swCode, /'js\/flashlight\.js'/, 'sw.js PRECACHE_ASSETS must include js/flashlight.js');
});

test('Night Flashlight: main.js safe initialization and F key toggle', () => {
  const mainCode = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
  assert.match(mainCode, /safe\(\s*['"]flashlight['"]\s*,/, 'main.js must initialize flashlight safely');
  assert.match(mainCode, /e\.key\s*===\s*['"]f['"]\s*\|\|\s*e\.key\s*===\s*['"]F['"]/, 'main.js must support F key toggle');
});
