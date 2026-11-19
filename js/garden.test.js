const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const garden = require('./garden.js');

describe('Midnight Garden Virtual Pet & Plant Care (pip-garden.exe)', () => {
  beforeEach(() => {
    garden.switchPlant('moonflower');
  });

  test('switchPlant sets active plant species and resets stage to Seed', () => {
    const ok = garden.switchPlant('fern');
    assert.strictEqual(ok, true);

    const state = garden.getState();
    assert.strictEqual(state.activeSpecies, 'fern');
    assert.strictEqual(state.speciesName, 'Starlight Fern');
    assert.strictEqual(state.stage, 0);
    assert.strictEqual(state.growthPoints, 0);
  });

  test('water increases moisture and adds growth points', () => {
    const initial = garden.getState();
    const updated = garden.water();

    assert.ok(updated.waterLevel >= initial.waterLevel);
    assert.ok(updated.growthPoints > initial.growthPoints);
  });

  test('singing and shining nurture plant and advance growth stages on 100 points', () => {
    // Nurture multiple times to reach 100 points
    for (let i = 0; i < 6; i++) {
      garden.sing();
    }

    const state = garden.getState();
    assert.ok(state.stage >= 1, 'Stage must advance after accumulating growth points');
  });

  test('harvest collects mature flower, increments total blooms, and replants', () => {
    // Advance to blooming stage
    for (let i = 0; i < 25; i++) {
      garden.sing();
      garden.water();
      garden.shine();
    }

    const preHarvest = garden.getState();
    assert.ok(preHarvest.stage >= 3, 'Must be blooming or higher to harvest');

    const harvested = garden.harvest();
    assert.strictEqual(harvested, true);

    const postHarvest = garden.getState();
    assert.strictEqual(postHarvest.totalBlooms, preHarvest.totalBlooms + 1);
    assert.strictEqual(postHarvest.stage, 0);
  });

  test('index.html contains #gardenWin window with controls, status bars, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="gardenWin"'), 'index.html must include #gardenWin window');
    assert.ok(html.includes('id="gardenPlantSelect"'), 'index.html must include #gardenPlantSelect');
    assert.ok(html.includes('id="gardenPlantIcon"'), 'index.html must include #gardenPlantIcon');
    assert.ok(html.includes('id="gardenWaterBtn"'), 'index.html must include #gardenWaterBtn');
    assert.ok(html.includes('id="gardenShineBtn"'), 'index.html must include #gardenShineBtn');
    assert.ok(html.includes('id="gardenSingBtn"'), 'index.html must include #gardenSingBtn');
    assert.ok(html.includes('id="gardenHarvestBtn"'), 'index.html must include #gardenHarvestBtn');
    assert.ok(html.includes('src="js/garden.js"'), 'index.html must include js/garden.js script tag');
  });
});
