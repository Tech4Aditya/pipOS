const test = require('node:test');
const assert = require('node:assert');
const {partial_overlap, miss, isPerfectDrop} = require('./maths.js');
test('partial overlap', () => {
    assert.strictEqual(partial_overlap(0, 5, 10, 10), 5);
});

test('no overlap', () => {
    assert.strictEqual(partial_overlap(0, 15, 10, 10), 0);
});

test('miss when blocks do not overlap', () => {
    assert.strictEqual(miss(0, 15, 10, 10), true);
});

test('miss when overlap is less than 3', () => {
    assert.strictEqual(miss(0, 8, 10, 10), true);
});

test('no miss when overlap is sufficient', () => {
    assert.strictEqual(miss(0, 5, 10, 10), false);
});

test('perfect drop when difference is less than 5', () => {
    assert.strictEqual(isPerfectDrop(0, 4), true);
});

test('not perfect when difference is 5', () => {
    assert.strictEqual(isPerfectDrop(0, 5), false);
});