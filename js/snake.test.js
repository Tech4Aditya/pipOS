import { test, describe } from 'node:test';
import assert from 'node:assert';
import Snake from './snake.js';

describe('PipOS Retro Garden Caterpillar Game (pip-snake.exe)', () => {
  test('createInitialState creates valid default game state', () => {
    const state = Snake.createInitialState();
    assert.strictEqual(state.grid, Snake.GRID_SIZE);
    assert.strictEqual(state.snake.length, 3);
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.gameOver, false);
    assert.deepStrictEqual(state.dir, { x: 1, y: 0 });
  });

  test('setDirection updates next direction and prevents 180-degree reversal', () => {
    const state = Snake.createInitialState();
    Snake.setDirection(state, { x: -1, y: 0 }); // Opposite of (1, 0)
    assert.deepStrictEqual(state.nextDir, { x: 1, y: 0 }); // should not change

    Snake.setDirection(state, { x: 0, y: 1 }); // Valid turn
    assert.deepStrictEqual(state.nextDir, { x: 0, y: 1 });
  });

  test('stepGame advances caterpillar forward', () => {
    const state = Snake.createInitialState();
    const initialHead = { ...state.snake[0] };
    Snake.stepGame(state);
    assert.strictEqual(state.snake[0].x, initialHead.x + 1);
    assert.strictEqual(state.snake[0].y, initialHead.y);
  });

  test('stepGame detects boundary collision and triggers gameOver', () => {
    const state = Snake.createInitialState(5);
    state.snake = [{ x: 4, y: 0 }];
    state.dir = { x: 1, y: 0 };
    state.nextDir = { x: 1, y: 0 };
    Snake.stepGame(state);
    assert.strictEqual(state.gameOver, true);
  });

  test('stepGame consumes food, grows caterpillar, and adds score', () => {
    const state = Snake.createInitialState(10);
    state.snake = [{ x: 4, y: 4 }, { x: 3, y: 4 }];
    state.food = { x: 5, y: 4 };
    state.dir = { x: 1, y: 0 };
    state.nextDir = { x: 1, y: 0 };
    Snake.stepGame(state);
    assert.strictEqual(state.score, 10);
    assert.strictEqual(state.snake.length, 3);
  });

  test('saveHighScore persists higher scores only', () => {
    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); }
    };

    assert.strictEqual(Snake.getHighScore(mockStorage), 0);
    Snake.saveHighScore(50, mockStorage);
    assert.strictEqual(Snake.getHighScore(mockStorage), 50);
    Snake.saveHighScore(30, mockStorage); // lower score shouldn't overwrite
    assert.strictEqual(Snake.getHighScore(mockStorage), 50);
    Snake.saveHighScore(120, mockStorage); // higher score updates
    assert.strictEqual(Snake.getHighScore(mockStorage), 120);
  });
});
