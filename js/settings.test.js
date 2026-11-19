const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Mock localStorage and document for testing environment
const mockStorage = (function () {
  let store = {};
  return {
    getItem: (k) => (store.hasOwnProperty(k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    key: (i) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; },
    _dump: () => store
  };
})();

global.localStorage = mockStorage;
global.window = global;
global.document = {
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => null,
    style: { setProperty: () => {} }
  },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => true
};

const settings = require('./settings.js');

describe('Desktop Control Panel & Settings (pip-settings.exe)', () => {
  beforeEach(() => {
    mockStorage.clear();
    settings.reset();
  });

  test('DEFAULTS object has valid initial configuration', () => {
    assert.strictEqual(settings.DEFAULTS.accent, 'berry');
    assert.strictEqual(settings.DEFAULTS.wallpaper, 'dots');
    assert.strictEqual(settings.DEFAULTS.fontScale, 'normal');
    assert.strictEqual(settings.DEFAULTS.nightShift, 0);
    assert.strictEqual(settings.DEFAULTS.masterVolume, 80);
    assert.strictEqual(settings.DEFAULTS.chimes, true);
  });

  test('get() retrieves existing default values', () => {
    assert.strictEqual(settings.get('accent'), 'berry');
    assert.strictEqual(settings.get('wallpaper'), 'dots');
    assert.strictEqual(settings.get('nightShift'), 0);
  });

  test('set() updates valid accent palette and rejects invalid', () => {
    assert.strictEqual(settings.set('accent', 'cyan'), true);
    assert.strictEqual(settings.get('accent'), 'cyan');

    assert.strictEqual(settings.set('accent', 'lavender'), true);
    assert.strictEqual(settings.get('accent'), 'lavender');

    assert.strictEqual(settings.set('accent', 'invalid-color'), false);
    assert.strictEqual(settings.get('accent'), 'lavender'); // preserved
  });

  test('set() updates valid wallpaper aesthetic and rejects unknown', () => {
    assert.strictEqual(settings.set('wallpaper', 'stars'), true);
    assert.strictEqual(settings.get('wallpaper'), 'stars');

    assert.strictEqual(settings.set('wallpaper', 'scanlines'), true);
    assert.strictEqual(settings.get('wallpaper'), 'scanlines');

    assert.strictEqual(settings.set('wallpaper', 'not-a-wallpaper'), false);
    assert.strictEqual(settings.get('wallpaper'), 'scanlines');
  });

  test('set() updates fontScale and clamps numeric nightShift and volume', () => {
    assert.strictEqual(settings.set('fontScale', 'cozy'), true);
    assert.strictEqual(settings.get('fontScale'), 'cozy');

    // Clamps nightShift to [0, 50]
    settings.set('nightShift', 80);
    assert.strictEqual(settings.get('nightShift'), 50);

    settings.set('nightShift', -10);
    assert.strictEqual(settings.get('nightShift'), 0);

    // Clamps masterVolume to [0, 100]
    settings.set('masterVolume', 150);
    assert.strictEqual(settings.get('masterVolume'), 100);

    settings.set('masterVolume', -20);
    assert.strictEqual(settings.get('masterVolume'), 0);
  });

  test('reset() restores all preferences to default values', () => {
    settings.set('accent', 'gold');
    settings.set('wallpaper', 'grid');
    settings.set('nightShift', 30);
    settings.set('chimes', false);

    const restored = settings.reset();
    assert.strictEqual(restored.accent, 'berry');
    assert.strictEqual(restored.wallpaper, 'dots');
    assert.strictEqual(restored.nightShift, 0);
    assert.strictEqual(restored.chimes, true);
  });

  test('getStorageUsage() calculates byte footprints in localStorage', () => {
    mockStorage.setItem('key1', 'abc');
    mockStorage.setItem('key2', '12345');

    const usage = settings.getStorageUsage();
    assert.ok(usage.totalBytes > 0);
    assert.strictEqual(typeof usage.totalKB, 'string');
    assert.ok(usage.items.length >= 2);
  });

  test('index.html contains #settings article window with tabs, controls, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="settings"'), 'index.html must include #settings window');
    assert.ok(html.includes('id="settingsTitle"'), 'index.html must include #settingsTitle');
    assert.ok(html.includes('data-tab="tabAppearance"'), 'index.html must include Appearance tab');
    assert.ok(html.includes('data-tab="tabAudio"'), 'index.html must include Audio tab');
    assert.ok(html.includes('data-tab="tabDisplay"'), 'index.html must include Display tab');
    assert.ok(html.includes('data-tab="tabStorage"'), 'index.html must include Storage tab');
    assert.ok(html.includes('id="settingsNightShift"'), 'index.html must include night shift slider');
    assert.ok(html.includes('id="settingsResetBtn"'), 'index.html must include factory reset button');
    assert.ok(html.includes('src="js/settings.js"'), 'index.html must include js/settings.js script tag');
  });
});
