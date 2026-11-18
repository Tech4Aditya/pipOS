const test = require('node:test');
const assert = require('node:assert/strict');
const { checkCollision, STARS_CONFIG } = require('./stars.js');

test('Catch the Falling Stars: collision detection logic', async (t) => {
  await t.test('detects collision when star is directly over cloud center', () => {
    const cloud = { x: 100, y: 300, w: 60, h: 20 };
    const star = { x: 130, y: 295, r: 10 }; // star bottom touches cloud.y
    assert.strictEqual(checkCollision(star, cloud), true);
  });

  await t.test('detects collision on left cloud edge with radius overlap', () => {
    const cloud = { x: 100, y: 300, w: 60, h: 20 };
    const star = { x: 95, y: 305, r: 8 }; // star.x + r = 103 >= cloud.x (100)
    assert.strictEqual(checkCollision(star, cloud), true);
  });

  await t.test('detects collision on right cloud edge with radius overlap', () => {
    const cloud = { x: 100, y: 300, w: 60, h: 20 };
    const star = { x: 165, y: 305, r: 8 }; // star.x - r = 157 <= cloud.x + cloud.w (160)
    assert.strictEqual(checkCollision(star, cloud), true);
  });

  await t.test('returns false when star is far above cloud', () => {
    const cloud = { x: 100, y: 300, w: 60, h: 20 };
    const star = { x: 130, y: 150, r: 10 };
    assert.strictEqual(checkCollision(star, cloud), false);
  });

  await t.test('returns false when star is far to the side of cloud', () => {
    const cloud = { x: 100, y: 300, w: 60, h: 20 };
    const star = { x: 25, y: 305, r: 10 };
    assert.strictEqual(checkCollision(star, cloud), false);
  });

  await t.test('handles null or undefined inputs safely without throwing', () => {
    assert.strictEqual(checkCollision(null, { x: 0, y: 0, w: 10, h: 10 }), false);
    assert.strictEqual(checkCollision({ x: 0, y: 0, r: 5 }, null), false);
    assert.strictEqual(checkCollision(undefined, undefined), false);
  });
});

test('Catch the Falling Stars: game configuration constants', () => {
  assert.ok(STARS_CONFIG.W > 0, 'Canvas width must be defined');
  assert.ok(STARS_CONFIG.H > 0, 'Canvas height must be defined');
  assert.strictEqual(STARS_CONFIG.MAX_MISSES, 3, 'Must allow exactly 3 misses before dawn');
  assert.ok(Array.isArray(STARS_CONFIG.STAR_PALETTE), 'Star palette must be an array');
  assert.ok(STARS_CONFIG.STAR_PALETTE.length >= 4, 'Must have at least 4 star colors');
  assert.ok(Array.isArray(STARS_CONFIG.NOTES), 'Chime notes must be defined');
  assert.ok(STARS_CONFIG.NOTES.length >= 5, 'Pentatonic scale must have at least 5 notes');
});

test('Catch the Falling Stars: index.html markup and accessibility contract', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="stars"'), 'index.html must contain #stars element');
  assert.ok(html.includes('class="win w-stars"'), 'index.html must use win and w-stars classes');
  assert.ok(html.includes('data-foldable'), 'stars window must be foldable');
  assert.ok(html.includes('id="starsCanvas"'), 'canvas must exist');
  assert.ok(html.includes('aria-label="Catch the Falling Stars canvas game"'), 'canvas must have descriptive aria-label');
  assert.ok(html.includes('tabindex="0"'), 'canvas must be focusable for keyboard controls');
  assert.ok(html.includes('id="starsGameOver"'), 'game over overlay must exist');
  assert.ok(html.includes('src="js/stars.js"'), 'index.html must load js/stars.js');
});

test('Catch the Falling Stars: Golden Comet Star archetype properties and power-up', () => {
  assert.strictEqual(STARS_CONFIG.COMET_CHANCE, 0.05, 'Golden Comet Star must have 5% spawn chance');
  assert.strictEqual(STARS_CONFIG.BOOST_DURATION, 6000, 'Cloud basket width boost must last 6 seconds');
  assert.ok(STARS_CONFIG.CLOUD_W_BOOST > STARS_CONFIG.CLOUD_W, 'Boosted cloud width must be wider than normal');

  const { initStars } = require('./stars.js');
  const mockCanvas = {
    getContext: () => ({
      scale: () => {},
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      rect: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      translate: () => {},
      rotate: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {}
    }),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, width: 300 })
  };
  global.document = {
    getElementById: (id) => (id === 'starsCanvas' ? mockCanvas : { textContent: '', setAttribute: () => {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} })
  };
  global.window = {
    devicePixelRatio: 1,
    addEventListener: () => {}
  };
  global.requestAnimationFrame = () => 1;
  global.cancelAnimationFrame = () => {};

  try {
    const game = initStars();
    assert.ok(game && game.state, 'initStars must return game instance with state');

    // Spawn forced comet star
    const comet = game.spawnStar('comet');
    assert.strictEqual(comet.type, 'comet', 'Must spawn comet star');
    assert.strictEqual(comet.color, '#ffd700', 'Comet star must be golden');
    assert.strictEqual(comet.scoreBonus, 3, 'Comet star must have +3 scoreBonus');

    // Catch comet star simulation
    game.state.running = true;
    game.state.score = 0;
    game.state.combo = 0;
    game.state.stars = [comet];
    comet.x = game.state.cloud.x + 10;
    comet.y = game.state.cloud.y + 5;

    game.update();

    // Catching comet awards base (10 + 0*2) + 3 = 13 points
    assert.strictEqual(game.state.score, 13, 'Comet catch must award 10 base + 3 bonus points');
    assert.strictEqual(game.state.cloud.isWide, true, 'Comet catch must activate wide cloud basket');
    assert.strictEqual(game.state.cloud.w, STARS_CONFIG.CLOUD_W_BOOST, 'Cloud width must widen during power-up');
    assert.ok(game.state.cloud.wideUntil > Date.now(), 'wideUntil must be scheduled in future');
  } finally {
    delete global.document;
    delete global.window;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
  }
});

test('Catch the Falling Stars: Slumber Moon Crystal recovers 1 miss', () => {
  assert.strictEqual(STARS_CONFIG.CRYSTAL_CHANCE, 0.03, 'Slumber Moon Crystal must have 3% spawn chance');

  const { initStars } = require('./stars.js');
  const mockCanvas = {
    getContext: () => ({
      scale: () => {},
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      rect: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      translate: () => {},
      rotate: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {}
    }),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, width: 300 })
  };
  global.document = {
    getElementById: (id) => (id === 'starsCanvas' ? mockCanvas : { textContent: '', setAttribute: () => {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} })
  };
  global.window = { devicePixelRatio: 1, addEventListener: () => {} };
  global.requestAnimationFrame = () => 1;
  global.cancelAnimationFrame = () => {};

  try {
    const game = initStars();
    const crystal = game.spawnStar('crystal');
    assert.strictEqual(crystal.type, 'crystal', 'Must spawn crystal star');

    game.state.running = true;
    game.state.misses = 2;
    game.state.stars = [crystal];
    crystal.x = game.state.cloud.x + 10;
    crystal.y = game.state.cloud.y + 5;

    game.update();

    assert.strictEqual(game.state.misses, 1, 'Catching Slumber Moon Crystal must recover 1 miss (decrements state.misses)');
  } finally {
    delete global.document;
    delete global.window;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
  }
});

test('Catch the Falling Stars: dynamic particle bursts with combo-scaled palettes', () => {
  const { getComboPalette, STARS_CONFIG } = require('./stars.js');
  assert.strictEqual(typeof getComboPalette, 'function', 'Must export getComboPalette helper');

  // Combo tier palette progressions
  const tier1 = getComboPalette(1);
  const tier2 = getComboPalette(4);
  const tier3 = getComboPalette(7);
  const supernova = getComboPalette(12);

  assert.deepStrictEqual(tier1, STARS_CONFIG.COMBO_PALETTES.tier1);
  assert.deepStrictEqual(tier2, STARS_CONFIG.COMBO_PALETTES.tier2);
  assert.deepStrictEqual(tier3, STARS_CONFIG.COMBO_PALETTES.tier3);
  assert.deepStrictEqual(supernova, STARS_CONFIG.COMBO_PALETTES.supernova);

  // Archetype special palettes
  const cometPal = getComboPalette(0, 'comet');
  const crystalPal = getComboPalette(0, 'crystal');
  assert.deepStrictEqual(cometPal, STARS_CONFIG.COMBO_PALETTES.comet);
  assert.deepStrictEqual(crystalPal, STARS_CONFIG.COMBO_PALETTES.crystal);
});

