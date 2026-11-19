const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const paint = require('./paint.js');

describe('Retro Pixel Art & Nursery Painter (pip-paint.exe)', () => {
  beforeEach(() => {
    paint.setGridSize(16);
    paint.clearCanvas();
  });

  test('PALETTE contains 16 valid distinct hex color codes', () => {
    assert.strictEqual(paint.PALETTE.length, 16);
    paint.PALETTE.forEach((hex) => {
      assert.match(hex, /^#[0-9a-fA-F]{6}$/);
    });
  });

  test('createGrid initializes square matrix with null values', () => {
    const grid16 = paint.createGrid(16);
    assert.strictEqual(grid16.length, 16);
    assert.strictEqual(grid16[0].length, 16);
    assert.strictEqual(grid16[0][0], null);

    const grid32 = paint.createGrid(32);
    assert.strictEqual(grid32.length, 32);
    assert.strictEqual(grid32[31].length, 32);
  });

  test('setPixel and getPixel read and write color coordinates safely', () => {
    assert.strictEqual(paint.setPixel(4, 5, '#a34063'), true);
    assert.strictEqual(paint.getPixel(4, 5), '#a34063');

    // Out of bounds check
    assert.strictEqual(paint.setPixel(100, 100, '#ffffff'), false);
    assert.strictEqual(paint.getPixel(100, 100), null);
    assert.strictEqual(paint.setPixel(-1, 0, '#ffffff'), false);
  });

  test('floodFill fills contiguous region and respects boundaries', () => {
    const grid = paint.createGrid(4);
    // Grid:
    // [null, null, null, null]
    // [null, '#ff0000', '#ff0000', null]
    // [null, '#ff0000', null, null]
    // [null, null, null, null]
    grid[1][1] = '#ff0000';
    grid[1][2] = '#ff0000';
    grid[2][1] = '#ff0000';

    paint.floodFill(grid, 1, 1, '#ff0000', '#00ff00');
    assert.strictEqual(grid[1][1], '#00ff00');
    assert.strictEqual(grid[1][2], '#00ff00');
    assert.strictEqual(grid[2][1], '#00ff00');
    // Surrounding untouched
    assert.strictEqual(grid[0][0], null);
    assert.strictEqual(grid[3][3], null);
  });

  test('undo and redo navigate history snapshots accurately', () => {
    paint.pushHistory();
    paint.setPixel(2, 2, '#a34063');
    paint.pushHistory();
    paint.setPixel(2, 2, '#cfeadb');
    paint.pushHistory();

    assert.strictEqual(paint.getPixel(2, 2), '#cfeadb');

    // Undo to previous pixel
    assert.strictEqual(paint.undo(), true);
    assert.strictEqual(paint.getPixel(2, 2), '#a34063');

    // Redo back to latest pixel
    assert.strictEqual(paint.redo(), true);
    assert.strictEqual(paint.getPixel(2, 2), '#cfeadb');
  });

  test('setGridSize accepts 16 and 32, rejecting invalid dimensions', () => {
    assert.strictEqual(paint.setGridSize(32), true);
    assert.strictEqual(paint.getState().size, 32);

    assert.strictEqual(paint.setGridSize(64), false);
    assert.strictEqual(paint.getState().size, 32);

    assert.strictEqual(paint.setGridSize(16), true);
    assert.strictEqual(paint.getState().size, 16);
  });

  test('tool selection validates valid tools', () => {
    assert.strictEqual(paint.setTool('pencil'), true);
    assert.strictEqual(paint.setTool('eraser'), true);
    assert.strictEqual(paint.setTool('bucket'), true);
    assert.strictEqual(paint.setTool('picker'), true);
    assert.strictEqual(paint.setTool('laser'), false);
  });

  test('index.html contains #paint window with canvas, palette, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="paint"'), 'index.html must include #paint window');
    assert.ok(html.includes('id="paintTitle"'), 'index.html must include #paintTitle');
    assert.ok(html.includes('id="paintCanvas"'), 'index.html must include #paintCanvas');
    assert.ok(html.includes('id="paintPalette"'), 'index.html must include #paintPalette');
    assert.ok(html.includes('id="paintUndoBtn"'), 'index.html must include #paintUndoBtn');
    assert.ok(html.includes('id="paintExportBtn"'), 'index.html must include #paintExportBtn');
    assert.ok(html.includes('src="js/paint.js"'), 'index.html must include js/paint.js script tag');
  });
});
