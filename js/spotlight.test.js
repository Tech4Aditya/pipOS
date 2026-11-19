'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const PipSpotlight = require('./spotlight.js');

describe('Quick Spotlight Command Launcher & Fuzzy App Finder (pip-spotlight)', () => {
  test('DEFAULT_ITEMS contains core desktop applications and system controls', () => {
    assert.ok(Array.isArray(PipSpotlight.DEFAULT_ITEMS));
    assert.ok(PipSpotlight.DEFAULT_ITEMS.length >= 10);

    const ids = PipSpotlight.DEFAULT_ITEMS.map(i => i.id);
    assert.ok(ids.includes('calc'));
    assert.ok(ids.includes('terminal'));
    assert.ok(ids.includes('notes'));
    assert.ok(ids.includes('theme'));
  });

  test('scoreMatch assigns higher priority to exact and prefix matches', () => {
    const exact = PipSpotlight.scoreMatch('calc', 'calc');
    const prefix = PipSpotlight.scoreMatch('calc', 'calculator');
    const wordPrefix = PipSpotlight.scoreMatch('calc', 'starlight calculator');
    const fuzzy = PipSpotlight.scoreMatch('calc', 'cosmic article clock');

    assert.ok(exact > prefix, 'Exact match must score higher than prefix');
    assert.ok(prefix >= wordPrefix, 'Prefix match must score higher or equal to word prefix');
    assert.ok(wordPrefix > fuzzy, 'Word prefix must score higher than subsequence fuzzy');
  });

  test('search filters catalog and ranks relevant items first', () => {
    const results = PipSpotlight.search('term');
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].id, 'terminal');

    const noteResults = PipSpotlight.search('notes');
    assert.ok(noteResults.length > 0);
    assert.strictEqual(noteResults[0].id, 'notes');
  });

  test('empty query returns top default catalog items', () => {
    const results = PipSpotlight.search('');
    assert.ok(results.length > 0);
    assert.ok(results.length <= 8);
  });

  test('unmatched query returns empty results array', () => {
    const results = PipSpotlight.search('xyz999nonexistentdream');
    assert.deepStrictEqual(results, []);
  });
});
