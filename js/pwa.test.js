const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.webmanifest');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const MAIN_JS_PATH = path.join(ROOT_DIR, 'js', 'main.js');

test('manifest.webmanifest is valid and meets PWA installability requirements', () => {
  assert.ok(fs.existsSync(MANIFEST_PATH), 'manifest.webmanifest must exist at root');
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  let manifest;
  assert.doesNotThrow(() => {
    manifest = JSON.parse(raw);
  }, 'manifest.webmanifest must be valid JSON');

  assert.ok(manifest.name, 'manifest must have a name');
  assert.ok(manifest.short_name, 'manifest must have a short_name');
  assert.strictEqual(manifest.display, 'standalone', 'display must be "standalone"');
  assert.ok(manifest.start_url, 'start_url must be present');
  assert.ok(manifest.background_color, 'background_color must be present');
  assert.ok(manifest.theme_color, 'theme_color must be present');

  // Verify icons array
  assert.ok(Array.isArray(manifest.icons), 'icons must be an array');
  assert.ok(manifest.icons.length >= 3, 'icons must have at least 192px, 512px, and maskable icons');

  const sizes = manifest.icons.map(i => i.sizes);
  assert.ok(sizes.includes('192x192'), 'icons must include 192x192');
  assert.ok(sizes.includes('512x512'), 'icons must include 512x512');

  const hasMaskable = manifest.icons.some(i => i.purpose && i.purpose.includes('maskable'));
  assert.ok(hasMaskable, 'manifest must provide a maskable icon for Android adaptive icons');

  // Verify every referenced icon exists on disk
  manifest.icons.forEach(icon => {
    const iconPath = path.join(ROOT_DIR, icon.src);
    assert.ok(fs.existsSync(iconPath), `Icon file ${icon.src} referenced in manifest must exist`);
  });
});

test('Application icons have valid PNG headers and exact required dimensions', () => {
  const iconChecks = [
    { file: 'assets/icon-192.png', width: 192, height: 192 },
    { file: 'assets/icon-512.png', width: 512, height: 512 },
    { file: 'assets/icon-maskable-512.png', width: 512, height: 512 },
    { file: 'assets/apple-touch-icon.png', width: 180, height: 180 }
  ];

  iconChecks.forEach(({ file, width, height }) => {
    const fullPath = path.join(ROOT_DIR, file);
    assert.ok(fs.existsSync(fullPath), `${file} must exist`);

    const buf = fs.readFileSync(fullPath);
    // PNG magic bytes
    assert.strictEqual(buf.readUInt32BE(0), 0x89504E47, `${file} must be a valid PNG file`);
    // IHDR width and height
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    assert.strictEqual(w, width, `${file} width must be ${width}`);
    assert.strictEqual(h, height, `${file} height must be ${height}`);
  });
});

test('index.html links manifest, icons, and Apple PWA meta tags', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  assert.match(html, /<link\s+[^>]*rel=["']manifest["'][^>]*href=["']manifest\.webmanifest["']/i,
    'index.html must link to manifest.webmanifest');
  assert.match(html, /<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']assets\/apple-touch-icon\.png["']/i,
    'index.html must link apple-touch-icon');
  assert.match(html, /<meta\s+[^>]*name=["']apple-mobile-web-app-capable["'][^>]*content=["']yes["']/i,
    'index.html must include apple-mobile-web-app-capable');
  assert.match(html, /<meta\s+[^>]*name=["']theme-color["']/i,
    'index.html must include theme-color meta tag');
});

test('sw.js service worker pre-caches all essential local assets and exists on disk', () => {
  assert.ok(fs.existsSync(SW_PATH), 'sw.js must exist at root');
  const swCode = fs.readFileSync(SW_PATH, 'utf8');
  const sw = require(SW_PATH);

  assert.ok(sw.CACHE_NAME, 'sw.js must define a CACHE_NAME');
  assert.ok(Array.isArray(sw.PRECACHE_ASSETS), 'sw.js must define PRECACHE_ASSETS list');

  // Verify all essential assets are listed
  const expectedAssets = [
    './',
    'index.html',
    'manifest.webmanifest',
    'css/style.css',
    'js/util.js',
    'js/audio.js',
    'js/wall.js',
    'js/fx.js',
    'js/pip.js',
    'js/toys.js',
    'js/main.js',
    'assets/favicon.svg',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/icon-maskable-512.png',
    'assets/apple-touch-icon.png'
  ];

  expectedAssets.forEach(asset => {
    assert.ok(sw.PRECACHE_ASSETS.includes(asset), `PRECACHE_ASSETS must include ${asset}`);
    if (asset !== './') {
      const assetPath = path.join(ROOT_DIR, asset);
      assert.ok(fs.existsSync(assetPath), `Pre-cached asset file ${asset} must exist on disk`);
    }
  });

  // Verify install and activate lifecycle handlers
  assert.match(swCode, /addEventListener\(['"]install['"]/, 'sw.js must have install listener');
  assert.match(swCode, /addEventListener\(['"]activate['"]/, 'sw.js must have activate listener');
  assert.match(swCode, /addEventListener\(['"]fetch['"]/, 'sw.js must have fetch listener');
  assert.match(swCode, /skipWaiting\(\)/, 'sw.js install event should call skipWaiting()');
  assert.match(swCode, /clients\.claim\(\)/, 'sw.js activate event should call clients.claim()');

  // Verify offline handling for Google Fonts
  assert.match(swCode, /fonts\.googleapis\.com/, 'sw.js must handle Google Fonts degradation');
  assert.match(swCode, /fonts\.gstatic\.com/, 'sw.js must handle Google Fonts assets');

  // Verify local origin constraint (cache only local files)
  assert.match(swCode, /url\.origin\s*!==\s*self\.location\.origin/, 'sw.js must only cache local origin files');

  // Verify navigation fallback for offline access
  assert.match(swCode, /event\.request\.mode\s*===\s*['"]navigate['"]/, 'sw.js must provide navigation fallback');
});

test('js/main.js registers service worker safely', () => {
  const mainJs = fs.readFileSync(MAIN_JS_PATH, 'utf8');

  assert.match(mainJs, /navigator\.serviceWorker\.register\(['"]sw\.js['"]\)/,
    'js/main.js must register sw.js');
  assert.match(mainJs, /'serviceWorker'\s+in\s+navigator/,
    'ServiceWorker registration must be feature-detected');
});
