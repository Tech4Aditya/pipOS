const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'css', 'style.css');
const STICKERS_JS_PATH = path.join(ROOT_DIR, 'js', 'stickers.js');
const TOYS_JS_PATH = path.join(ROOT_DIR, 'js', 'toys.js');
const PIP_JS_PATH = path.join(ROOT_DIR, 'js', 'pip.js');
const FX_JS_PATH = path.join(ROOT_DIR, 'js', 'fx.js');
const MAIN_JS_PATH = path.join(ROOT_DIR, 'js', 'main.js');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');

test('index.html contains #stickers window with .win, data-foldable, and Reset button', () => {
  assert.ok(fs.existsSync(HTML_PATH), 'index.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Verify sticker book article exists
  assert.match(html, /<article\s+[^>]*id=["']stickers["'][^>]*>/i, '#stickers article must exist in index.html');

  const match = html.match(/<article\s+[^>]*id=["']stickers["'][^>]*>/i);
  assert.ok(match, '#stickers element found');
  const tagStr = match[0];

  assert.match(tagStr, /class=["'][^"']*\bwin\b[^"']*["']/i, '#stickers must reuse the .win component class');
  assert.match(tagStr, /data-foldable/, '#stickers must include data-foldable attribute');
  assert.match(tagStr, /aria-labelledby=["']stickersTitle["']/, '#stickers must have aria-labelledby="stickersTitle"');

  // Verify window title
  assert.match(html, /<h3\s+[^>]*id=["']stickersTitle["'][^>]*>\s*sticker-book\.exe/i,
    'Window title must be "sticker-book.exe" with id="stickersTitle"');

  // Verify Reset button exists
  assert.match(html, /<button[^>]*id=["']resetStickersBtn["'][^>]*>.*Reset.*<\/button>/is,
    'Sticker book must contain a Reset button with id="resetStickersBtn"');

  // Verify progress counter
  assert.match(html, /id=["']stickerCount["'][^>]*aria-live=["']polite["']/i,
    'Sticker book must contain an aria-live counter element #stickerCount');
});

test('index.html defines all 5 required achievements with accessible text alternatives', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const requiredAchievements = [
    { id: 'dreams5', label: 'found all 5 dreams', name: 'Nightlight Keeper' },
    { id: 'blocks10', label: 'stacked 10 blocks', name: 'Tower Stacker' },
    { id: 'route7', label: 'delivered all 7 dreams', name: 'Cloud Courier' },
    { id: 'star', label: 'woke Pip with the gold star', name: 'Star Detective' },
    { id: 'wish', label: 'left a wish', name: 'Midnight Wisher' }
  ];

  requiredAchievements.forEach(ach => {
    // Verify data-sticker attribute exists
    assert.match(html, new RegExp(`data-sticker=["']${ach.id}["']`, 'i'),
      `Must include sticker card for ${ach.id} (${ach.label})`);

    // Verify accessible role and aria-label
    assert.match(html, new RegExp(`data-sticker=["']${ach.id}["'][^>]*role=["']listitem["'][^>]*aria-label=`, 'i'),
      `Sticker card ${ach.id} must have role="listitem" and an accessible aria-label`);

    // Verify visible title exists
    assert.match(html, new RegExp(ach.name, 'i'),
      `Sticker card must display title "${ach.name}"`);
  });
});

test('js/stickers.js implements persistent store integration, unlock, and reset', () => {
  assert.ok(fs.existsSync(STICKERS_JS_PATH), 'js/stickers.js must exist');
  const stickersSrc = fs.readFileSync(STICKERS_JS_PATH, 'utf8');

  // Verify core methods are exported
  assert.match(stickersSrc, /function\s+unlock\s*\(/, 'stickers.js must define unlock');
  assert.match(stickersSrc, /function\s+reset\s*\(/, 'stickers.js must define reset');
  assert.match(stickersSrc, /function\s+isUnlocked\s*\(/, 'stickers.js must define isUnlocked');
  assert.match(stickersSrc, /function\s+getUnlocked\s*\(/, 'stickers.js must define getUnlocked');

  // Verify usage of PIP.store
  assert.match(stickersSrc, /store\.get\(['"]stickers['"]/, 'Must read stickers from store');
  assert.match(stickersSrc, /store\.set\(['"]stickers['"]/, 'Must write stickers to store');

  // Test functional logic via Node.js module export
  const stickers = require(STICKERS_JS_PATH);
  assert.ok(stickers, 'Module should export cleanly');
  assert.strictEqual(stickers.STICKERS.length, 5, 'Must define exactly 5 stickers');

  const expectedIds = ['dreams5', 'blocks10', 'route7', 'star', 'wish'];
  expectedIds.forEach(id => {
    assert.ok(stickers.STICKERS.some(s => s.id === id), `STICKERS array must include id "${id}"`);
  });

  // Verify functional unlock, idempotency, and reset behavior
  stickers.reset();
  assert.strictEqual(stickers.countUnlocked(), 0);
  assert.strictEqual(stickers.isUnlocked('dreams5'), false);

  // Unlock dreams5
  const res1 = stickers.unlock('dreams5', true);
  assert.strictEqual(res1, true, 'First unlock of dreams5 must return true');
  assert.strictEqual(stickers.isUnlocked('dreams5'), true);
  assert.strictEqual(stickers.countUnlocked(), 1);

  // Idempotency: second unlock of same sticker must return false
  const res2 = stickers.unlock('dreams5', true);
  assert.strictEqual(res2, false, 'Unlocking already unlocked dreams5 must return false');
  assert.strictEqual(stickers.countUnlocked(), 1);

  // Invalid ID must return false
  const res3 = stickers.unlock('nonexistent_achievement', true);
  assert.strictEqual(res3, false, 'Unlocking invalid id must return false');
  assert.strictEqual(stickers.countUnlocked(), 1);

  // Unlock all remaining stickers
  ['blocks10', 'route7', 'star', 'wish'].forEach(id => {
    assert.strictEqual(stickers.unlock(id, true), true);
    assert.strictEqual(stickers.isUnlocked(id), true);
  });
  assert.strictEqual(stickers.countUnlocked(), 5);

  // Reset clears all stickers
  stickers.reset();
  assert.strictEqual(stickers.countUnlocked(), 0);
  expectedIds.forEach(id => {
    assert.strictEqual(stickers.isUnlocked(id), false);
  });
});

test('Achievement triggers are hooked into toys.js, pip.js, and fx.js', () => {
  const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');
  const pipSrc = fs.readFileSync(PIP_JS_PATH, 'utf8');
  const fxSrc = fs.readFileSync(FX_JS_PATH, 'utf8');

  // 1. Found all 5 dreams in darkroom
  assert.match(toysSrc, /PIP\.stickers\.unlock\(['"]dreams5['"]\)/,
    'toys.js must unlock "dreams5" when all five dreams are found');

  // 2. Stacked 10 blocks in Rattle & Blocks
  assert.match(toysSrc, /PIP\.stickers\.unlock\(['"]blocks10['"]\)/,
    'toys.js must unlock "blocks10" when tower reaches 10 blocks');

  // 3. Delivered all 7 dreams in Dream Delivery
  assert.match(toysSrc, /PIP\.stickers\.unlock\(['"]route7['"]\)/,
    'toys.js must unlock "route7" when all 7 dreams are delivered');

  // 4. Woke Pip with the gold star
  assert.match(pipSrc, /PIP\.stickers\.unlock\(['"]star['"]\)/,
    'pip.js must unlock "star" when gold star is tapped 5 times');

  // 5. Left a wish on the wish wall
  assert.match(fxSrc, /PIP\.stickers\.unlock\(['"]wish['"]\)/,
    'fx.js must unlock "wish" when a wish is submitted');
});

test('Desktop navigation rail and service worker integrate stickers', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const sw = require(SW_PATH);

  // Desktop shortcut link
  assert.match(html, /<a\s+[^>]*href=["']#stickers["'][^>]*>.*stickers\.exe<\/a>/is,
    '.desk-icons must contain shortcut link to #stickers');

  // Icon style
  assert.match(css, /\.ic-star\s*\{/, 'css/style.css must define .ic-star icon styling');

  // Service Worker precache
  assert.ok(sw.PRECACHE_ASSETS.includes('js/stickers.js'),
    'sw.js PRECACHE_ASSETS must include "js/stickers.js"');
});

test('stickers init auto-detects Nightlight Keeper achievement when dr_total_found >= 5', () => {
  const stickersSrc = fs.readFileSync(STICKERS_JS_PATH, 'utf8');
  assert.match(stickersSrc, /dr_total_found/, 'stickers.js must check dr_total_found in auto-detection');
  assert.match(stickersSrc, /unlock\(['"]dreams5['"],\s*true\)/, 'stickers.js must unlock dreams5 during auto-detection');
});

test('stickers render updates DOM classes and accessible labels', () => {
  const stickers = require(STICKERS_JS_PATH);

  const mockCard = {
    classes: new Set(['sticker-card', 'is-locked']),
    classList: {
      toggle(cls, state) {
        if (state) mockCard.classes.add(cls);
        else mockCard.classes.delete(cls);
      },
      contains(cls) { return mockCard.classes.has(cls); }
    },
    attrs: {},
    setAttribute(k, v) { mockCard.attrs[k] = v; },
    getAttribute(k) { return mockCard.attrs[k]; },
    querySelector(sel) {
      if (sel === '.st-status') return mockStatus;
      return null;
    }
  };
  const mockStatus = {
    textContent: '',
    classes: new Set(),
    classList: {
      toggle(cls, state) {
        if (state) mockStatus.classes.add(cls);
        else mockStatus.classes.delete(cls);
      }
    }
  };
  const mockCount = { textContent: '' };

  const mockDoc = {
    querySelector(sel) {
      if (sel === '#stickerCount') return mockCount;
      if (sel === '[data-sticker="dreams5"]') return mockCard;
      if (sel === '.st-status') return mockStatus;
      return null;
    }
  };

  global.document = mockDoc;
  try {
    stickers.reset();
    stickers.render();
    assert.strictEqual(mockCount.textContent, '0 of 5 stickers collected');
    assert.strictEqual(mockCard.classList.contains('is-locked'), true);
    assert.strictEqual(mockCard.classList.contains('is-unlocked'), false);
    assert.match(mockCard.getAttribute('aria-label'), /Locked/);

    stickers.unlock('dreams5', true);
    stickers.render();
    assert.strictEqual(mockCount.textContent, '1 of 5 stickers collected');
    assert.strictEqual(mockCard.classList.contains('is-unlocked'), true);
    assert.strictEqual(mockCard.classList.contains('is-locked'), false);
    assert.match(mockCard.getAttribute('aria-label'), /Unlocked/);
  } finally {
    delete global.document;
  }
});
