(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  var PIP = root.PIP = root.PIP || {};
  var store = PIP.store || {
    get: function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var STARS_CONFIG = {
    W: 300,
    H: 380,
    MAX_MISSES: 3,
    CLOUD_W: 68,
    CLOUD_W_BOOST: 96,
    CLOUD_H: 22,
    BOOST_DURATION: 6000,
    COMET_CHANCE: 0.05,
    CRYSTAL_CHANCE: 0.03,
    STAR_PALETTE: ['#ffd77a', '#a5f3fc', '#e9d5ff', '#fbcfe8', '#fdba74'],
    COMBO_PALETTES: {
      default: ['#ffd77a', '#a5f3fc', '#e9d5ff', '#fbcfe8', '#fdba74'],
      tier1: ['#ffd77a', '#fbcfe8', '#ffffff'],
      tier2: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'],
      tier3: ['#facc15', '#fb923c', '#f43f5e', '#a855f7', '#60a5fa'],
      supernova: ['#ffd700', '#ff007f', '#00f5d4', '#7b2cbf', '#ffffff', '#ff9e00'],
      comet: ['#ffd700', '#f59e0b', '#fef08a', '#ffffff'],
      crystal: ['#38bdf8', '#a78bfa', '#e0e7ff', '#67e8f9']
    },
    NOTES: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33] // Pentatonic chime frequencies
  };

  function getComboPalette(combo, starType) {
    if (starType === 'comet' || starType === 'golden_comet') return STARS_CONFIG.COMBO_PALETTES.comet;
    if (starType === 'crystal' || starType === 'slumber_crystal') return STARS_CONFIG.COMBO_PALETTES.crystal;
    if (!combo || combo < 3) return STARS_CONFIG.COMBO_PALETTES.tier1;
    if (combo < 6) return STARS_CONFIG.COMBO_PALETTES.tier2;
    if (combo < 10) return STARS_CONFIG.COMBO_PALETTES.tier3;
    return STARS_CONFIG.COMBO_PALETTES.supernova;
  }

  function checkCollision(star, cloud) {
    if (!star || !cloud) return false;
    var withinX = star.x >= (cloud.x - star.r) && star.x <= (cloud.x + cloud.w + star.r);
    var withinY = (star.y + star.r) >= cloud.y && (star.y - star.r) <= (cloud.y + cloud.h);
    return withinX && withinY;
  }

  function initStars() {
    var cv = document.getElementById('starsCanvas');
    var scoreEl = document.getElementById('starsScore');
    var bestEl = document.getElementById('starsBest');
    var missesEl = document.getElementById('starsMisses');
    var actionBtn = document.getElementById('starsActionBtn');
    var resetBtn = document.getElementById('starsResetBestBtn');
    var gameOverEl = document.getElementById('starsGameOver');
    var restartBtn = document.getElementById('starsRestartBtn');
    var finalScoreEl = document.getElementById('starsFinalScore');
    var container = document.getElementById('stars');

    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = STARS_CONFIG.W;
    var H = STARS_CONFIG.H;
    var dpr = Math.min((window.devicePixelRatio || 1) * 1.15, 3);
    cv.width = W * dpr;
    cv.height = H * dpr;

    var state = {
      running: false,
      isPaused: false,
      isGameOver: false,
      visible: true,
      score: 0,
      best: parseInt(store.get('pip_stars_best', '0'), 10) || 0,
      misses: 0,
      combo: 0,
      stars: [],
      particles: [],
      cloud: {
        x: (W - STARS_CONFIG.CLOUD_W) / 2,
        y: H - 44,
        w: STARS_CONFIG.CLOUD_W,
        h: STARS_CONFIG.CLOUD_H,
        targetX: (W - STARS_CONFIG.CLOUD_W) / 2,
        wideUntil: 0,
        isWide: false
      },
      keys: { left: false, right: false },
      lastSpawn: 0,
      rafId: 0
    };

    function updateStatsUI() {
      if (scoreEl) scoreEl.textContent = String(state.score);
      if (bestEl) bestEl.textContent = String(state.best);
      if (missesEl) {
        var starsStr = '';
        for (var i = 0; i < STARS_CONFIG.MAX_MISSES; i++) {
          starsStr += (i < state.misses) ? '★' : '☆';
        }
        missesEl.textContent = starsStr;
        missesEl.setAttribute('aria-label', 'Misses: ' + state.misses + ' of ' + STARS_CONFIG.MAX_MISSES);
      }
    }

    function playCatchChime(combo) {
      if (!PIP.audio || typeof PIP.audio.note !== 'function' || !PIP.audio.isOn()) return;
      var noteIdx = Math.min(combo % STARS_CONFIG.NOTES.length, STARS_CONFIG.NOTES.length - 1);
      var freq = STARS_CONFIG.NOTES[noteIdx];
      PIP.audio.note(freq, { dur: 0.6, gain: 0.18, type: 'sine' });
    }

    function playMissSound() {
      if (!PIP.audio || typeof PIP.audio.note !== 'function' || !PIP.audio.isOn()) return;
      PIP.audio.note(180, { dur: 0.4, gain: 0.12, type: 'triangle' });
    }

    function spawnStar(forcedType) {
      var rand = Math.random();
      var type = 'normal';
      if (forcedType) {
        type = forcedType;
      } else if (rand < STARS_CONFIG.COMET_CHANCE) {
        type = 'comet';
      } else if (rand < (STARS_CONFIG.COMET_CHANCE + STARS_CONFIG.CRYSTAL_CHANCE)) {
        type = 'crystal';
      }

      var r = 9 + Math.random() * 4;
      var speed = 1.2 + Math.random() * 1.4 + Math.min(state.score * 0.02, 1.8);
      if (type === 'comet') {
        speed *= 1.3; // Falls 30% faster
        r = 11 + Math.random() * 3;
      } else if (type === 'crystal') {
        r = 10 + Math.random() * 3;
      }

      var color;
      if (type === 'comet') {
        color = '#ffd700'; // Golden Comet Star
      } else if (type === 'crystal') {
        color = '#38bdf8'; // Slumber Moon Crystal
      } else {
        color = STARS_CONFIG.STAR_PALETTE[Math.floor(Math.random() * STARS_CONFIG.STAR_PALETTE.length)];
      }

      var starObj = {
        x: r + Math.random() * (W - r * 2),
        y: -r,
        vy: speed,
        r: r,
        angle: Math.random() * Math.PI,
        vAngle: (Math.random() - 0.5) * 0.04,
        color: color,
        type: type,
        scoreBonus: type === 'comet' ? 3 : 0
      };
      state.stars.push(starObj);
      return starObj;
    }

    function spawnParticles(x, y, colorOrPalette, combo) {
      var palette;
      if (Array.isArray(colorOrPalette)) {
        palette = colorOrPalette;
      } else if (typeof colorOrPalette === 'string' && colorOrPalette) {
        palette = [colorOrPalette];
      } else {
        palette = getComboPalette(combo || 0);
      }

      var currentCombo = combo || state.combo || 0;
      var count = 7 + Math.min(currentCombo * 3, 25);
      for (var i = 0; i < count; i++) {
        var ang = Math.random() * Math.PI * 2;
        var spd = 1 + Math.random() * (2.5 + Math.min(currentCombo * 0.35, 3));
        var col = palette[Math.floor(Math.random() * palette.length)];
        state.particles.push({
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 0.5,
          life: 1,
          decay: 0.025 + Math.random() * 0.03,
          color: col,
          size: 2 + Math.random() * (2 + Math.min(currentCombo * 0.2, 2.5))
        });
      }
    }

    function drawStarShape(c, x, y, r, angle, color, type) {
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      if (type === 'crystal') {
        c.fillStyle = color || '#38bdf8';
        c.beginPath();
        c.moveTo(0, -r * 1.35);
        c.lineTo(r * 0.7, 0);
        c.lineTo(0, r * 1.35);
        c.lineTo(-r * 0.7, 0);
        c.closePath();
        c.fill();

        // Shimmer facet
        c.fillStyle = 'rgba(255, 255, 255, 0.75)';
        c.beginPath();
        c.moveTo(0, -r * 1.35);
        c.lineTo(0, r * 1.35);
        c.lineTo(-r * 0.7, 0);
        c.closePath();
        c.fill();

        c.restore();
        return;
      }

      if (type === 'comet') {
        c.shadowColor = '#ffd700';
        c.shadowBlur = 9;
      }

      c.fillStyle = color;
      c.beginPath();
      var pts = 5;
      for (var i = 0; i < pts * 2; i++) {
        var a = (i * Math.PI) / pts - Math.PI / 2;
        var dist = (i % 2 === 0) ? r : r * 0.48;
        var px = Math.cos(a) * dist;
        var py = Math.sin(a) * dist;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();

      if (type === 'comet') {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    }

    function drawCloud(c, cloud) {
      c.save();
      var x = cloud.x;
      var y = cloud.y;
      var w = cloud.w;
      var h = cloud.h;
      var isWide = Boolean(cloud.isWide);

      // Soft glow (warm golden rim when wide basket is active)
      if (isWide) {
        c.shadowColor = 'rgba(255, 215, 0, 0.65)';
        c.shadowBlur = 12;
      }
      c.fillStyle = isWide ? 'rgba(255, 253, 230, 0.96)' : 'rgba(255, 255, 255, 0.9)';
      c.beginPath();
      c.arc(x + 16, y + 12, 12, 0, Math.PI * 2);
      c.arc(x + w / 2, y + 8, 14, 0, Math.PI * 2);
      c.arc(x + w - 16, y + 12, 12, 0, Math.PI * 2);
      c.rect(x + 12, y + 10, w - 24, h - 10);
      c.fill();

      // Cloud outline
      c.strokeStyle = isWide ? '#f59e0b' : '#64748b';
      c.lineWidth = isWide ? 2 : 1.5;
      c.stroke();

      // Sleepy eyes on cloud
      c.strokeStyle = '#334155';
      c.lineWidth = 1.8;
      c.beginPath();
      var eyeMid = x + w / 2;
      c.arc(eyeMid - 6, y + 12, 3, 0.2, Math.PI - 0.2);
      c.arc(eyeMid + 6, y + 12, 3, 0.2, Math.PI - 0.2);
      c.stroke();

      c.restore();
    }

    function triggerGameOver() {
      state.running = false;
      state.isPaused = false;
      state.isGameOver = true;
      if (state.score > state.best) {
        state.best = state.score;
        store.set('pip_stars_best', String(state.best));
      }
      updateStatsUI();

      if (finalScoreEl) finalScoreEl.textContent = String(state.score);
      if (gameOverEl) {
        gameOverEl.classList.remove('hidden');
        gameOverEl.setAttribute('aria-hidden', 'false');
      }
      if (actionBtn) {
        actionBtn.textContent = 'Play Again';
        actionBtn.setAttribute('aria-label', 'Play Catch the Falling Stars again');
      }
    }

    function update() {
      if (!state.running) return;

      var now = Date.now();
      // Cloud width power-up: widens cloud basket for 6 seconds
      var isWide = Boolean(state.cloud.wideUntil && now < state.cloud.wideUntil);
      state.cloud.w = isWide ? STARS_CONFIG.CLOUD_W_BOOST : STARS_CONFIG.CLOUD_W;
      state.cloud.isWide = isWide;

      // Cloud movement
      if (state.keys.left) state.cloud.targetX -= 5.5;
      if (state.keys.right) state.cloud.targetX += 5.5;

      // Clamp targetX
      state.cloud.targetX = Math.max(0, Math.min(W - state.cloud.w, state.cloud.targetX));
      state.cloud.x += (state.cloud.targetX - state.cloud.x) * 0.3;

      // Spawning
      var spawnInterval = Math.max(700, 1500 - state.score * 15);
      if (now - state.lastSpawn > spawnInterval) {
        spawnStar();
        state.lastSpawn = now;
      }

      // Update stars
      for (var i = state.stars.length - 1; i >= 0; i--) {
        var s = state.stars[i];
        s.y += s.vy;
        s.angle += s.vAngle;

        // Sparkling trail for Golden Comet Star
        if (s.type === 'comet' && Math.random() < 0.6) {
          state.particles.push({
            x: s.x + (Math.random() - 0.5) * 8,
            y: s.y - s.r * 0.4 + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.6 - Math.random() * 0.8,
            life: 0.65,
            decay: 0.05 + Math.random() * 0.04,
            color: Math.random() < 0.5 ? '#ffd700' : '#ffffff',
            size: 1.5 + Math.random() * 2
          });
        }

        // Check catch
        if (checkCollision(s, state.cloud)) {
          var basePoints = 10 + state.combo * 2;
          if (s.type === 'comet') {
            state.score += basePoints + 3; // awards +3 score
            state.cloud.wideUntil = Date.now() + STARS_CONFIG.BOOST_DURATION; // widens cloud basket for 6 seconds
            state.cloud.w = STARS_CONFIG.CLOUD_W_BOOST;
            state.cloud.isWide = true;
          } else if (s.type === 'crystal') {
            state.score += basePoints;
            if (state.misses > 0) {
              state.misses--; // Recovers 1 miss (decrements state.misses)
            }
          } else {
            state.score += basePoints;
          }

          state.combo++;
          var burstPalette = getComboPalette(state.combo, s.type);
          spawnParticles(s.x, s.y, burstPalette, state.combo);
          playCatchChime(state.combo);
          state.stars.splice(i, 1);
          updateStatsUI();
          continue;
        }

        // Check miss
        if (s.y > H + s.r) {
          state.stars.splice(i, 1);
          state.misses++;
          state.combo = 0;
          playMissSound();
          updateStatsUI();

          if (state.misses >= STARS_CONFIG.MAX_MISSES) {
            triggerGameOver();
            return;
          }
        }
      }

      // Update particles
      for (var j = state.particles.length - 1; j >= 0; j--) {
        var p = state.particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          state.particles.splice(j, 1);
        }
      }
    }

    function render() {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Night sky backdrop
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#100e26');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Distant static twinkling stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(35, 45, 2, 2);
      ctx.fillRect(80, 110, 1.5, 1.5);
      ctx.fillRect(160, 30, 2, 2);
      ctx.fillRect(220, 85, 1.5, 1.5);
      ctx.fillRect(270, 130, 2, 2);

      // Draw active falling stars
      for (var i = 0; i < state.stars.length; i++) {
        var st = state.stars[i];
        drawStarShape(ctx, st.x, st.y, st.r, st.angle, st.color, st.type);
      }

      // Draw spark particles
      for (var j = 0; j < state.particles.length; j++) {
        var pt = state.particles[j];
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Pip's cloud paddle
      drawCloud(ctx, state.cloud);

      ctx.restore();
    }

    function loop() {
      if (state.visible && state.running) {
        update();
        render();
        state.rafId = requestAnimationFrame(loop);
      } else if (state.visible && !state.running) {
        render(); // keep static render fresh
      }
    }

    function startGame() {
      if (gameOverEl) {
        gameOverEl.classList.add('hidden');
        gameOverEl.setAttribute('aria-hidden', 'true');
      }
      state.score = 0;
      state.misses = 0;
      state.combo = 0;
      state.stars = [];
      state.particles = [];
      state.cloud.w = STARS_CONFIG.CLOUD_W;
      state.cloud.wideUntil = 0;
      state.cloud.isWide = false;
      state.running = true;
      state.isPaused = false;
      state.isGameOver = false;
      state.lastSpawn = Date.now();
      updateStatsUI();

      if (actionBtn) {
        actionBtn.textContent = 'Pause Game';
        actionBtn.setAttribute('aria-label', 'Pause Catch the Falling Stars game');
      }

      cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(loop);
    }

    function pauseGame() {
      if (!state.running) return;
      state.running = false;
      state.isPaused = true;
      cancelAnimationFrame(state.rafId);
      if (actionBtn) {
        actionBtn.textContent = 'Resume Game';
        actionBtn.setAttribute('aria-label', 'Resume Catch the Falling Stars game');
      }
      render();
    }

    function resumeGame() {
      if (state.running || !state.isPaused) return;
      state.running = true;
      state.isPaused = false;
      state.lastSpawn = Date.now();
      if (actionBtn) {
        actionBtn.textContent = 'Pause Game';
        actionBtn.setAttribute('aria-label', 'Pause Catch the Falling Stars game');
      }
      cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(loop);
    }

    // Event Listeners
    if (actionBtn) {
      actionBtn.addEventListener('click', function () {
        if (state.running) {
          pauseGame();
        } else if (state.isPaused) {
          resumeGame();
        } else {
          startGame();
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        startGame();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.best = 0;
        store.set('pip_stars_best', '0');
        updateStatsUI();
      });
    }

    // Pointer controls
    function setCloudPointerX(clientX) {
      var rect = cv.getBoundingClientRect();
      var relX = clientX - rect.left;
      var scaledX = (relX / rect.width) * W;
      state.cloud.targetX = scaledX - state.cloud.w / 2;
    }

    cv.addEventListener('pointermove', function (e) {
      setCloudPointerX(e.clientX);
    });

    cv.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) {
        setCloudPointerX(e.touches[0].clientX);
      }
    }, { passive: true });

    // Keyboard controls
    cv.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.keys.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.keys.right = true;
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (state.running) pauseGame();
        else if (state.isPaused) resumeGame();
        else startGame();
        e.preventDefault();
      }
    });

    cv.addEventListener('keyup', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false;
    });

    // Visibility & Offscreen Pausing via IntersectionObserver
    if ('IntersectionObserver' in window && container) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          state.visible = entry.isIntersecting;
          if (!state.visible && state.running) {
            pauseGame();
          }
        });
      }, { threshold: 0.1 });
      obs.observe(container);
    }

    updateStatsUI();
    render();

    return {
      state: state,
      startGame: startGame,
      pauseGame: pauseGame,
      resumeGame: resumeGame,
      triggerGameOver: triggerGameOver,
      spawnStar: spawnStar,
      spawnParticles: spawnParticles,
      update: update,
      render: render
    };
  }

  PIP.stars = {
    init: initStars,
    checkCollision: checkCollision,
    getComboPalette: getComboPalette,
    CONFIG: STARS_CONFIG
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      checkCollision: checkCollision,
      getComboPalette: getComboPalette,
      STARS_CONFIG: STARS_CONFIG,
      initStars: initStars
    };
  }
})();
