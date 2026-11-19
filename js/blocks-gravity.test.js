'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TOYS_JS_PATH = path.join(ROOT_DIR, 'js', 'toys.js');
const TERMINAL_JS_PATH = path.join(ROOT_DIR, 'js', 'terminal.js');

describe('Rattle & Blocks Gravity Inversion', () => {
  test('js/toys.js exports setGravity and getGravity API methods', () => {
    const toys = require(TOYS_JS_PATH);

    assert.strictEqual(typeof toys.setGravity, 'function', 'toys.setGravity must be a function');
    assert.strictEqual(typeof toys.getGravity, 'function', 'toys.getGravity must be a function');
  });

  test('toys.setGravity toggles direction between 1 (downward) and -1 (upward)', () => {
    const toys = require(TOYS_JS_PATH);

    // Set downward (1)
    assert.strictEqual(toys.setGravity(1), true);
    assert.strictEqual(toys.getGravity(), 1, 'Gravity should be 1 (downward)');

    // Set upward (-1)
    assert.strictEqual(toys.setGravity(-1), true);
    assert.strictEqual(toys.getGravity(), -1, 'Gravity should be -1 (upward)');

    // Text aliases: "down" and "up"
    assert.strictEqual(toys.setGravity('down'), true);
    assert.strictEqual(toys.getGravity(), 1);

    assert.strictEqual(toys.setGravity('up'), true);
    assert.strictEqual(toys.getGravity(), -1);

    // "flip" or "toggle"
    assert.strictEqual(toys.setGravity('flip'), true);
    assert.strictEqual(toys.getGravity(), 1);

    assert.strictEqual(toys.setGravity('flip'), true);
    assert.strictEqual(toys.getGravity(), -1);

    // Reset to normal downward
    toys.setGravity(1);
    assert.strictEqual(toys.getGravity(), 1);

    // Rejects invalid inputs without altering state
    assert.strictEqual(toys.setGravity(0), false);
    assert.strictEqual(toys.setGravity('sideways'), false);
    assert.strictEqual(toys.getGravity(), 1);
  });

  test('js/toys.js drop update loop multiplies gravitational acceleration g by gravity direction', () => {
    const toysSrc = fs.readFileSync(TOYS_JS_PATH, 'utf8');

    // Verifies update loop uses g and blockGravityDir
    assert.match(
      toysSrc,
      /var\s+g\s*=\s*900/,
      'Update loop must define gravitational acceleration g = 900'
    );
    assert.match(
      toysSrc,
      /g\s*\*\s*blockGravityDir/,
      'Update loop must multiply gravitational acceleration g by gravity direction'
    );
    assert.match(
      toysSrc,
      /p\.vy\s*\+\s*\(?\s*g\s*\*\s*blockGravityDir\s*\)?\s*\*\s*dt/,
      'Velocity calculation must scale by g * blockGravityDir * dt'
    );
  });

  test('js/terminal.js registers gravity command with up, down, and flip parameters', () => {
    const term = require(TERMINAL_JS_PATH);

    assert.ok(term.COMMANDS.includes('gravity'), 'COMMANDS must include gravity');
    assert.ok(term.PARAM_HINTS.gravity, 'PARAM_HINTS must include gravity');
    assert.deepStrictEqual(
      term.PARAM_HINTS.gravity.params,
      ['up', 'down', 'flip'],
      'gravity command must support up, down, flip parameters'
    );
  });

  test('terminal gravity command executes correctly and flips block gravity', () => {
    const term = require(TERMINAL_JS_PATH);
    const toys = require(TOYS_JS_PATH);

    // Initial query
    toys.setGravity(1);
    const queryRes = term.executeCommand('gravity');
    assert.ok(queryRes.output.includes('Gravity: normal (down 1 ⬇️)'), 'Should report normal gravity');

    // Invert via "gravity up"
    const upRes = term.executeCommand('gravity up');
    assert.ok(upRes.output.includes('Gravity inverted'), 'Should confirm gravity inverted');
    assert.strictEqual(toys.getGravity(), -1, 'Toys gravity should now be -1');

    // Restore via "gravity down"
    const downRes = term.executeCommand('gravity down');
    assert.ok(downRes.output.includes('Gravity restored'), 'Should confirm gravity restored');
    assert.strictEqual(toys.getGravity(), 1, 'Toys gravity should now be 1');

    // Flip via "gravity flip"
    const flipRes1 = term.executeCommand('gravity flip');
    assert.ok(flipRes1.output.includes('Gravity inverted'), 'Should invert on flip');
    assert.strictEqual(toys.getGravity(), -1);

    const flipRes2 = term.executeCommand('gravity flip');
    assert.ok(flipRes2.output.includes('Gravity restored'), 'Should restore on second flip');
    assert.strictEqual(toys.getGravity(), 1);

    // Subcommand under "blocks gravity"
    const blocksGravRes = term.executeCommand('blocks gravity flip');
    assert.ok(blocksGravRes.output.includes('Gravity inverted'), 'blocks gravity flip must invert gravity');
    assert.strictEqual(toys.getGravity(), -1);

    // Reset back to 1
    toys.setGravity(1);
  });
});
