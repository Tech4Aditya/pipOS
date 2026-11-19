/**
 * js/flight.js
 * Rooftop Dream Delivery Flight Mini-Game 2D (pip-flight.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.flight = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var HIGH_SCORE_KEY = 'pipos_flight_highscore';
  var WIDTH = 480;
  var HEIGHT = 280;
  var GRAVITY = 0.26;
  var FLAP_IMPULSE = -5.2;
  var SCROLL_SPEED = 2.0;

  var state = {
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    deliveries: 0,
    highScore: 0,
    pip: { x: 70, y: 120, vy: 0, r: 14, angle: 0 },
    rooftops: [],
    stars: [],
    particles: [],
    animId: null
  };

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  function loadHighScore() {
    var store = getStorage();
    if (!store) return;
    try {
      var val = store.getItem(HIGH_SCORE_KEY);
      if (val !== null) state.highScore = parseInt(val, 10) || 0;
    } catch (_) {}
  }

  function saveHighScore() {
    var store = getStorage();
    if (!store) return;
    try {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        store.setItem(HIGH_SCORE_KEY, String(state.highScore));
      }
    } catch (_) {}
  }

  function initGame() {
    loadHighScore();

    state.isPlaying = false;
    state.isPaused = false;
    state.isGameOver = false;
    state.score = 0;
    state.deliveries = 0;
    state.pip = { x: 70, y: 120, vy: 0, r: 14, angle: 0 };
    state.rooftops = [];
    state.stars = [];
    state.particles = [];

    // Seed initial rooftops
    var currentX = 0;
    while (currentX < WIDTH + 200) {
      var w = 90 + Math.floor(Math.random() * 60);
      var h = 50 + Math.floor(Math.random() * 70);
      var hasChimney = Math.random() > 0.3;
      var chimneyX = currentX + w / 2;

      state.rooftops.push({
        x: currentX,
        width: w,
        height: h,
        chimney: hasChimney ? { x: chimneyX, y: HEIGHT - h - 18, delivered: false } : null
      });

      // Maybe add a star
      if (Math.random() > 0.4) {
        state.stars.push({
          x: currentX + w / 2,
          y: HEIGHT - h - 50 - Math.floor(Math.random() * 60),
          r: 6,
          collected: false
        });
      }

      currentX += w;
    }

    return state;
  }

  function flap() {
    if (state.isGameOver) {
      initGame();
      state.isPlaying = true;
      return true;
    }
    if (!state.isPlaying) {
      state.isPlaying = true;
    }
    if (state.isPaused) return false;

    state.pip.vy = FLAP_IMPULSE;
    spawnParticles(state.pip.x, state.pip.y + 10, 4, '#fde047');
    return true;
  }

  function spawnParticles(x, y, count, color) {
    for (var i = 0; i < count; i++) {
      state.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1.0,
        color: color || '#fff'
      });
    }
  }

  function step() {
    if (!state.isPlaying || state.isPaused || state.isGameOver) {
      return { score: state.score, gameOver: state.isGameOver };
    }

    // Apply gravity
    state.pip.vy += GRAVITY;
    if (state.pip.vy > 6.0) state.pip.vy = 6.0;
    state.pip.y += state.pip.vy;
    state.pip.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, state.pip.vy * 0.08));

    // Ceiling check
    if (state.pip.y - state.pip.r < 0) {
      state.pip.y = state.pip.r;
      state.pip.vy = 0;
    }

    // Floor check (soft bedtime bounce, or game over)
    if (state.pip.y + state.pip.r >= HEIGHT) {
      state.pip.y = HEIGHT - state.pip.r;
      state.isGameOver = true;
      saveHighScore();
      return { score: state.score, gameOver: true };
    }

    // Scroll world
    for (var i = 0; i < state.rooftops.length; i++) {
      var r = state.rooftops[i];
      r.x -= SCROLL_SPEED;
      if (r.chimney) r.chimney.x -= SCROLL_SPEED;

      // Delivery check: Pip near chimney top
      if (r.chimney && !r.chimney.delivered) {
        var dx = Math.abs(state.pip.x - r.chimney.x);
        var dy = Math.abs(state.pip.y - r.chimney.y);
        if (dx < 22 && dy < 30) {
          r.chimney.delivered = true;
          state.deliveries++;
          state.score += 50;
          spawnParticles(r.chimney.x, r.chimney.y, 8, '#f472b6');
        }
      }

      // Roof collision check
      var roofTopY = HEIGHT - r.height;
      if (
        state.pip.x + state.pip.r > r.x &&
        state.pip.x - state.pip.r < r.x + r.width &&
        state.pip.y + state.pip.r > roofTopY
      ) {
        state.isGameOver = true;
        saveHighScore();
        return { score: state.score, gameOver: true };
      }
    }

    // Stars collection & scroll
    for (var s = 0; s < state.stars.length; s++) {
      var star = state.stars[s];
      star.x -= SCROLL_SPEED;

      if (!star.collected) {
        var sDx = state.pip.x - star.x;
        var sDy = state.pip.y - star.y;
        var dist = Math.sqrt(sDx * sDx + sDy * sDy);
        if (dist < state.pip.r + star.r + 4) {
          star.collected = true;
          state.score += 20;
          spawnParticles(star.x, star.y, 6, '#fde047');
        }
      }
    }

    // Prune and generate new rooftops
    while (state.rooftops.length > 0 && state.rooftops[0].x + state.rooftops[0].width < 0) {
      state.rooftops.shift();
    }

    var lastRoof = state.rooftops[state.rooftops.length - 1];
    if (lastRoof && lastRoof.x + lastRoof.width < WIDTH + 100) {
      var newW = 90 + Math.floor(Math.random() * 60);
      var newH = 50 + Math.floor(Math.random() * 70);
      var newChimney = Math.random() > 0.35;
      var newChimneyX = lastRoof.x + lastRoof.width + newW / 2;

      state.rooftops.push({
        x: lastRoof.x + lastRoof.width,
        width: newW,
        height: newH,
        chimney: newChimney ? { x: newChimneyX, y: HEIGHT - newH - 18, delivered: false } : null
      });

      if (Math.random() > 0.4) {
        state.stars.push({
          x: newChimneyX,
          y: HEIGHT - newH - 50 - Math.floor(Math.random() * 50),
          r: 6,
          collected: false
        });
      }
    }

    // Filter stars
    state.stars = state.stars.filter(function (st) { return st.x > -20; });

    // Update particles
    for (var p = state.particles.length - 1; p >= 0; p--) {
      var pt = state.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) {
        state.particles.splice(p, 1);
      }
    }

    return { score: state.score, gameOver: false };
  }

  function render(ctx) {
    if (!ctx) return;

    // Background night sky
    var grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Crescent Moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(410, 45, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(404, 43, 20, 0, Math.PI * 2);
    ctx.fill();

    // Distant background clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(100, 70, 30, 0, Math.PI * 2);
    ctx.arc(130, 60, 40, 0, Math.PI * 2);
    ctx.arc(165, 70, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw rooftops
    state.rooftops.forEach(function (r) {
      // Building body
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(r.x, HEIGHT - r.height, r.width, r.height);

      // Roof trim
      ctx.fillStyle = '#334155';
      ctx.fillRect(r.x, HEIGHT - r.height, r.width, 5);

      // Windows
      ctx.fillStyle = '#fef08a';
      var winY = HEIGHT - r.height + 16;
      if (winY < HEIGHT - 15) {
        ctx.fillRect(r.x + 15, winY, 12, 16);
        if (r.width > 60) ctx.fillRect(r.x + r.width - 27, winY, 12, 16);
      }

      // Chimney
      if (r.chimney) {
        ctx.fillStyle = r.chimney.delivered ? '#10b981' : '#f43f5e';
        ctx.fillRect(r.chimney.x - 7, r.chimney.y, 14, 18);
        ctx.fillStyle = '#fda4af';
        ctx.fillRect(r.chimney.x - 9, r.chimney.y, 18, 4);

        if (r.chimney.delivered) {
          ctx.fillStyle = '#a7f3d0';
          ctx.font = '10px sans-serif';
          ctx.fillText('✨', r.chimney.x - 5, r.chimney.y - 4);
        }
      }
    });

    // Draw Stars
    state.stars.forEach(function (st) {
      if (!st.collected) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r + 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw particles
    state.particles.forEach(function (pt) {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Pip (with starlight umbrella/glider)
    ctx.save();
    ctx.translate(state.pip.x, state.pip.y);
    ctx.rotate(state.pip.angle);

    // Umbrella / Glider dome
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(0, -8, 14, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 4);
    ctx.stroke();

    // Pip body
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Nightcap
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(6, -2);
    ctx.lineTo(10, -10);
    ctx.closePath();
    ctx.fill();

    // Pip face
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3, 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Overlay if game over
    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Dream Delivery Complete!', WIDTH / 2, HEIGHT / 2 - 14);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Score: ' + state.score + ' | Deliveries: ' + state.deliveries, WIDTH / 2, HEIGHT / 2 + 14);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.fillText('Click or Press Space to Glide Again', WIDTH / 2, HEIGHT / 2 + 38);
    } else if (!state.isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press Space or Tap to Flutter Pip', WIDTH / 2, HEIGHT / 2);
    }
  }

  function init() {
    initGame();

    var canvas = document.getElementById('flightCanvas');
    var startBtn = document.getElementById('flightStartBtn');
    var scoreEl = document.getElementById('flightScore');
    var delEl = document.getElementById('flightDeliveries');
    var highEl = document.getElementById('flightHigh');

    if (highEl) highEl.textContent = String(state.highScore);

    if (canvas) {
      var ctx = canvas.getContext('2d');
      render(ctx);

      function loop() {
        step();
        render(ctx);
        if (scoreEl) scoreEl.textContent = String(state.score);
        if (delEl) delEl.textContent = String(state.deliveries);
        if (highEl) highEl.textContent = String(state.highScore);
        state.animId = requestAnimationFrame(loop);
      }

      state.animId = requestAnimationFrame(loop);

      canvas.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        flap();
      });

      window.addEventListener('keydown', function (e) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
          // If flight canvas is visible in viewport or focused
          var win = document.getElementById('flightWin');
          if (win && !win.classList.contains('is-folded')) {
            e.preventDefault();
            flap();
          }
        }
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', function () {
        flap();
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    initGame: initGame,
    flap: flap,
    step: step,
    render: render,
    getState: function () {
      return {
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        isGameOver: state.isGameOver,
        score: state.score,
        deliveries: state.deliveries,
        highScore: state.highScore,
        pip: Object.assign({}, state.pip),
        rooftopCount: state.rooftops.length
      };
    },
    init: init
  };
});
