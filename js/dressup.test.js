const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const dressupModule = require('./dressup.js');

test('Pip Dress-up: API contract', () => {
  assert.strictEqual(typeof dressupModule.init, 'function', 'init must be a function');
  assert.strictEqual(typeof dressupModule.applyPalette, 'function', 'applyPalette must be a function');
  assert.strictEqual(typeof dressupModule.setPalette, 'function', 'setPalette must be a function');
  assert.strictEqual(typeof dressupModule.getPalette, 'function', 'getPalette must be a function');
  assert.strictEqual(typeof dressupModule.getPalettes, 'function', 'getPalettes must be a function');
});

test('Pip Dress-up: defines at least 5 cute canon-friendly palettes', () => {
  const palettes = dressupModule.getPalettes();
  const keys = Object.keys(palettes);
  assert.ok(keys.length >= 5, `Must have at least 5 palettes (found ${keys.length})`);

  keys.forEach(k => {
    const p = palettes[k];
    assert.ok(p.id, `Palette ${k} must have an id`);
    assert.ok(p.name, `Palette ${k} must have a human-readable name`);
    assert.match(p.cap, /^#[0-9a-fA-F]{6}$/, `Palette ${k} cap color must be a 6-digit hex`);
    assert.match(p.bow, /^#[0-9a-fA-F]{6}$/, `Palette ${k} bow color must be a 6-digit hex`);
    assert.match(p.star, /^#[0-9a-fA-F]{6}$/, `Palette ${k} star color must be a 6-digit hex`);
  });
});

test('Pip Dress-up: palette application and persistence', () => {
  const pal = dressupModule.applyPalette('minty', false);
  assert.strictEqual(pal.id, 'minty');
  assert.strictEqual(dressupModule.getPalette(), 'minty');

  // Fallback on invalid palette
  const fallback = dressupModule.applyPalette('invalid_name', false);
  assert.strictEqual(fallback.id, 'classic');
  assert.strictEqual(dressupModule.getPalette(), 'classic');
});

test('Pip Dress-up: index.html DOM accessibility and picker components', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Dress up button
  assert.match(html, /<button\s+[^>]*id=["']dressupBtn["'][^>]*aria-controls=["']dressupPicker["']/i,
    'dressupBtn must exist with aria-controls="dressupPicker"');
  assert.match(html, /<button\s+[^>]*id=["']dressupBtn["'][^>]*aria-expanded=["']false["']/i,
    'dressupBtn must have initial aria-expanded="false"');

  // Dress up picker container
  assert.match(html, /<div\s+[^>]*id=["']dressupPicker["'][^>]*hidden/i,
    'dressupPicker must start hidden');
  assert.match(html, /<div\s+[^>]*id=["']dressupPicker["'][^>]*role=["']region["']/i,
    'dressupPicker must have role="region"');

  // Radio options
  assert.match(html, /data-palette=["']classic["']/, 'Must include classic palette option');
  assert.match(html, /data-palette=["']minty["']/, 'Must include minty palette option');
  assert.match(html, /data-palette=["']twilight["']/, 'Must include twilight palette option');
  assert.match(html, /data-palette=["']cotton["']/, 'Must include cotton palette option');
  assert.match(html, /data-palette=["']starlight["']/, 'Must include starlight palette option');

  // Script loading
  assert.match(html, /<script\s+[^>]*src=["']js\/dressup\.js["'][^>]*defer/i,
    'index.html must load js/dressup.js with defer');
});

test('Pip Dress-up: css/style.css contrast protection and styling', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

  // Contrast protection via dark outline stroke
  assert.match(css, /\.pip-svg\s+\.p-cap\s*\{[^}]*stroke:\s*#5c4033/,
    '.p-cap must retain high-contrast dark outline stroke');
  assert.match(css, /\.pip-svg\s+\.p-bow[^}]*\{[^}]*stroke:\s*#5c4033/,
    '.p-bow must retain high-contrast dark outline stroke');

  // Variables in :root
  assert.match(css, /--pip-cap:\s*#8b8fd9/, '--pip-cap default must exist in :root');
  assert.match(css, /--pip-bow:\s*#ff7fa8/, '--pip-bow default must exist in :root');

  // Reduced motion
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.p-cap/,
    'Must disable transitions for reduced motion');
});

test('Pip Dress-up: sw.js pre-caches js/dressup.js', () => {
  const swCode = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(swCode, /'js\/dressup\.js'/, 'sw.js PRECACHE_ASSETS must include js/dressup.js');
});

test('Pip Dress-up: main.js safe initialization', () => {
  const mainCode = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
  assert.match(mainCode, /safe\(\s*['"]dressup['"]\s*,/, 'main.js must initialize dressup safely');
});
