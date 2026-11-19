/**
 * PipOS Retro Garden Caterpillar Game (pip-snake.exe)
 * Classic arcade snake game on canvas with garden caterpillar aesthetics and local high scores.
 * Zero external dependencies. IEEE IGDTUW Open Source Week 10.0.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PipSnake = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GRID_SIZE = 15;
  const STORAGE_KEY = 'pip_snake_highscore';

  function createInitialState(grid = GRID_SIZE) {
    return {
      grid,
      snake: [
        { x: 5, y: 7 },
        { x: 4, y: 7 },
        { x: 3, y: 7 }
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 10, y: 7 },
      score: 0,
      gameOver: false,
      paused: false
    };
  }

  function setDirection(state, newDir) {
    if (!state || state.gameOver) return state;
    // Disallow 180-degree immediate reversal
    if (state.dir.x + newDir.x === 0 && state.dir.y + newDir.y === 0) {
      return state;
    }
    state.nextDir = { x: newDir.x, y: newDir.y };
    return state;
  }

  function spawnFood(snake, grid = GRID_SIZE) {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    const emptyCells = [];
    for (let x = 0; x < grid; x++) {
      for (let y = 0; y < grid; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) return { x: 0, y: 0 };
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function stepGame(state) {
    if (!state || state.gameOver || state.paused) return state;

    state.dir = { ...state.nextDir };
    const head = {
      x: state.snake[0].x + state.dir.x,
      y: state.snake[0].y + state.dir.y
    };

    // Boundary check
    if (head.x < 0 || head.x >= state.grid || head.y < 0 || head.y >= state.grid) {
      state.gameOver = true;
      return state;
    }

    // Self collision check
    for (let i = 0; i < state.snake.length; i++) {
      if (state.snake[i].x === head.x && state.snake[i].y === head.y) {
        state.gameOver = true;
        return state;
      }
    }

    state.snake.unshift(head);

    // Food check
    if (head.x === state.food.x && head.y === state.food.y) {
      state.score += 10;
      state.food = spawnFood(state.snake, state.grid);
      if (typeof globalThis.window?.playPipTone === 'function') {
        globalThis.window.playPipTone(660, 0.1);
      }
    } else {
      state.snake.pop();
    }

    return state;
  }

  function getHighScore(storage = globalThis.localStorage) {
    if (!storage) return 0;
    try {
      return parseInt(storage.getItem(STORAGE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(score, storage = globalThis.localStorage) {
    if (!storage) return false;
    try {
      const current = getHighScore(storage);
      if (score > current) {
        storage.setItem(STORAGE_KEY, String(score));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function initSnake() {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('snakeScore');
    const highEl = document.getElementById('snakeHighScore');
    const startBtn = document.getElementById('snakeStartBtn');
    const upBtn = document.getElementById('snakeUpBtn');
    const downBtn = document.getElementById('snakeDownBtn');
    const leftBtn = document.getElementById('snakeLeftBtn');
    const rightBtn = document.getElementById('snakeRightBtn');

    let state = createInitialState();
    let timer = null;

    if (highEl) {
      highEl.textContent = `Best: ${getHighScore()}`;
    }

    function render() {
      const size = canvas.width / state.grid;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= state.grid; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(canvas.width, i * size);
        ctx.stroke();
      }

      // Draw Food (Golden Apple / Star)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(
        state.food.x * size + size / 2,
        state.food.y * size + size / 2,
        size / 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw Caterpillar
      state.snake.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? '#22c55e' : '#4ade80';
        ctx.beginPath();
        ctx.arc(
          seg.x * size + size / 2,
          seg.y * size + size / 2,
          size / 2.2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (idx === 0) {
          // Eyes
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(seg.x * size + size * 0.35, seg.y * size + size * 0.35, 2, 0, Math.PI * 2);
          ctx.arc(seg.x * size + size * 0.65, seg.y * size + size * 0.35, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '12px monospace';
        ctx.fillText('Press Start to Play Again', canvas.width / 2, canvas.height / 2 + 15);
      }
    }

    function tick() {
      stepGame(state);
      if (scoreEl) scoreEl.textContent = `Score: ${state.score}`;
      if (state.gameOver) {
        clearInterval(timer);
        timer = null;
        saveHighScore(state.score);
        if (highEl) highEl.textContent = `Best: ${getHighScore()}`;
        if (startBtn) startBtn.textContent = '▶ Play Again';
      }
      render();
    }

    function start() {
      if (timer) clearInterval(timer);
      state = createInitialState();
      state.food = spawnFood(state.snake, state.grid);
      if (scoreEl) scoreEl.textContent = `Score: 0`;
      if (startBtn) startBtn.textContent = '🔄 Restart';
      render();
      timer = setInterval(tick, 140);
    }

    if (startBtn) {
      startBtn.addEventListener('click', start);
    }

    function handleKey(e) {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        setDirection(state, { x: 0, y: -1 });
        e.preventDefault();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        setDirection(state, { x: 0, y: 1 });
        e.preventDefault();
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        setDirection(state, { x: -1, y: 0 });
        e.preventDefault();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        setDirection(state, { x: 1, y: 0 });
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKey);

    if (upBtn) upBtn.addEventListener('click', () => setDirection(state, { x: 0, y: -1 }));
    if (downBtn) downBtn.addEventListener('click', () => setDirection(state, { x: 0, y: 1 }));
    if (leftBtn) leftBtn.addEventListener('click', () => setDirection(state, { x: -1, y: 0 }));
    if (rightBtn) rightBtn.addEventListener('click', () => setDirection(state, { x: 1, y: 0 }));

    render();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSnake);
    } else {
      initSnake();
    }
  }

  return {
    GRID_SIZE,
    createInitialState,
    setDirection,
    spawnFood,
    stepGame,
    getHighScore,
    saveHighScore,
    initSnake
  };
});
