/* fx.js: sparkle trail, confetti, dream odometer, wish wall. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function () { return null; };
  var $$ = PIP.$$ || function () { return []; };
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var toast = PIP.toast || function () {};
  var reduce = PIP.reduceMotion || { matches: false };

  /* ---------- sparkle trail (mouse and pen only, off for reduced motion) ---------- */
  var GLYPHS = ['✦', '★', '✧', '·'];
  var COLORS = ['#a34063', '#ffb454', '#8b8fd9', '#ff9fc0'];
  var live = 0, lastSpark = 0;

  function initSparkles() {
    document.addEventListener('pointermove', function (e) {
      if (reduce.matches || e.pointerType === 'touch') return;
      var now = performance.now();
      if (now - lastSpark < 36 || live > 28) return;
      lastSpark = now;
      var s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      s.style.setProperty('--dx', (Math.random() * 30 - 15).toFixed(0) + 'px');
      s.style.setProperty('--dy', (14 + Math.random() * 22).toFixed(0) + 'px');
      s.style.fontSize = (10 + Math.random() * 12).toFixed(0) + 'px';
      live++;
      s.addEventListener('animationend', function () { s.remove(); live--; });
      document.body.appendChild(s);
    }, { passive: true });
  }

  /* ---------- confetti (own tiny canvas, no library) ---------- */
  var confettiRunning = false;
  function confetti(count) {
    var cv = $('#confetti');
    if (!cv || confettiRunning || reduce.matches) return;
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;
    confettiRunning = true;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.display = 'block';
    var colors = ['#a34063', '#ffb454', '#fff1da', '#8b8fd9', '#ff9fc0', '#9ff0d0'];
    var n = count || 150, parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 140, y: H * 0.45,
        vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 7, h: 8 + Math.random() * 8,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length], star: Math.random() < 0.28
      });
    }
    var last = performance.now();
    (function frame(now) {
      var dt = Math.min((now - last) / 16.67, 2);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      parts.forEach(function (p) {
        p.vy += 0.34 * dt; p.vx *= 0.995;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > H + 30) return;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.star) { ctx.font = '16px serif'; ctx.fillText('✦', -6, 6); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) window.requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); cv.style.display = 'none'; confettiRunning = false; }
    })(last);
  }

  /* ---------- dream odometer ---------- */
  function initOdometer() {
    var el = $('#odo');
    if (!el) return;
    var DIGITS = 6;
    var value = parseInt(store.get('dreams', '1204'), 10);
    if (!isFinite(value) || value < 1204) value = 1204;
    var cols = [];
    for (var i = 0; i < DIGITS; i++) {
      var d = document.createElement('span');
      d.className = 'odo-digit';
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      strip.innerHTML = '<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b>';
      d.appendChild(strip);
      el.appendChild(d);
      cols.push(strip);
    }
    function render() {
      var s = String(value);
      while (s.length < DIGITS) s = '0' + s;
      cols.forEach(function (strip, idx) { strip.style.setProperty('--d', s.charAt(idx)); });
      el.setAttribute('aria-label', 'Dreams delivered tonight: ' + value);
    }
    render();
    var inView = true;
    PIP.watchVisible(el, function (v) { inView = v; });
    (function tick() {
      window.setTimeout(function () {
        if (inView && !document.hidden) {
          value += 1;
          store.set('dreams', value);
          render();
        }
        tick();
      }, 5000 + Math.random() * 4000);
    })();
  }

  /* ---------- wish wall (shared backend with local fallback) ---------- */
  var SEEDS = [
    { n: 'Boo-ton', w: 'Pip fixed my hiccups with one note.' },
    { n: 'Mrs. Hoot', w: 'The nightlight is still warm at 4am.' },
    { n: 'Wisp', w: 'I dreamt of soup. Thank you, Pip!' }
  ];
  var ROT = [-2.2, 1.6, -1, 2.4, -1.8, 0.8];

  function getBackendConfig() {
    if (typeof window !== 'undefined' && typeof window.PIP_WALL_BACKEND === 'object' && window.PIP_WALL_BACKEND !== null) {
      return window.PIP_WALL_BACKEND;
    }
    var meta = document.querySelector('meta[name="pip-wall-backend"]');
    if (meta && meta.content) {
      try {
        return JSON.parse(meta.content);
      } catch (e) {
        return { type: 'firebase', url: meta.content };
      }
    }
    return null;
  }

  function loadLocalWishes() {
    try {
      var a = JSON.parse(store.get('wall', '[]'));
      if (!Array.isArray(a)) return [];
      return a.filter(function (x) { return x && typeof x.n === 'string' && typeof x.w === 'string'; }).slice(-30);
    } catch (e) { return []; }
  }

  function saveLocalWish(item) {
    try {
      var current = loadLocalWishes();
      current.push(item);
      current = current.slice(-30);
      store.set('wall', JSON.stringify(current));
    } catch (e) {}
  }

  function loadRateHistory() {
    try {
      var h = JSON.parse(store.get('wall_rate', '[]'));
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function saveRateHistory(h) {
    try {
      store.set('wall_rate', JSON.stringify(h.slice(-10)));
    } catch (e) {}
  }

  // Create a note DOM element strictly using textContent to prevent HTML injection (XSS)
  function createNoteElement(x, i, doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.createElement !== 'function') return null;
    var li = d.createElement('li');
    li.className = 'note n' + ((i || 0) % 4);
    if (li.style && typeof li.style.setProperty === 'function') {
      li.style.setProperty('--rot', ROT[(i || 0) % ROT.length] + 'deg');
    }
    var p = d.createElement('p');
    p.textContent = (x && typeof x.w === 'string') ? x.w : ''; // Strict textContent — prevents XSS
    var by = d.createElement('span');
    by.textContent = (x && typeof x.n === 'string') ? x.n : 'A sleepy visitor'; // Strict textContent — prevents XSS
    li.appendChild(p);
    li.appendChild(by);
    return li;
  }

  function initWall() {
    var form = $('#gbForm'), list = $('#gbList');
    if (!form || !list) return;
    var wish = $('#gbWish'), name = $('#gbName'), count = $('#gbCount'), err = $('#gbError');
    var statusEl = $('#gbFine');
    var wall = PIP.wall;
    var backend = getBackendConfig();

    var activeWishes = loadLocalWishes();
    var isConnected = false;

    function render() {
      list.textContent = '';
      var all = activeWishes.concat(SEEDS);
      all.forEach(function (x, i) {
        var note = createNoteElement(x, i, document);
        if (note) list.appendChild(note);
      });
    }

    render();

    // If backend is configured, attempt retrieval
    if (backend && wall) {
      wall.fetchWishes(backend, function (remoteWishes) {
        if (remoteWishes && Array.isArray(remoteWishes)) {
          isConnected = true;
          activeWishes = remoteWishes;
          store.set('wall_remote_cache', JSON.stringify(remoteWishes));
          if (statusEl) statusEl.textContent = 'Shared wish wall • Synchronized live across dreamers.';
          render();
        } else {
          // Backend offline or unreachable: fall back to cached remote or local
          try {
            var cached = JSON.parse(store.get('wall_remote_cache', ''));
            if (Array.isArray(cached) && cached.length) activeWishes = cached;
          } catch (e) {}
          if (statusEl) statusEl.textContent = 'Wishes are saved on this device only (offline mode).';
          render();
        }
      });
    } else {
      if (statusEl) statusEl.textContent = 'Wishes are saved on this device only.';
    }

    wish.addEventListener('input', function () {
      count.textContent = wish.value.length + ' / 120';
      count.setAttribute('aria-label', 'Character count: ' + wish.value.length + ' of 120');
      if (err.textContent) {
        err.textContent = '';
        wish.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Input length validation & sanitization
      var validation = wall
        ? wall.validateWish(wish.value, name.value)
        : { ok: !!wish.value.trim(), wish: wish.value.trim().slice(0, 120), name: name.value.trim().slice(0, 20) || 'A sleepy visitor' };

      if (!validation.ok) {
        err.textContent = validation.error || 'Write a wish first. Even a tiny one counts.';
        wish.focus();
        return;
      }

      // Rate limiting
      var history = loadRateHistory();
      if (wall) {
        var check = wall.checkRateLimit(history);
        if (!check.allowed) {
          err.textContent = check.error;
          return;
        }
        history = check.history;
      }

      // Passed validation and rate limit
      history.push(Date.now());
      saveRateHistory(history);

      var newWish = { n: validation.name, w: validation.wish, t: Date.now() };
      if (name.value.trim()) store.set('visitor', validation.name);

      wish.value = '';
      count.textContent = '0 / 120';
      count.setAttribute('aria-label', 'Character count: 0 of 120');
      err.textContent = '';

      // Optimistic or confirmed update
      if (backend && isConnected && wall) {
        wall.postWish(backend, newWish, function (success) {
          if (success) {
            activeWishes.unshift(newWish);
            activeWishes = activeWishes.slice(0, 30);
            render();
            toast('Pinned to the wall. Pip yawns happily.');
          } else {
            // Failed to post remotely: fall back to local storage
            saveLocalWish(newWish);
            activeWishes.unshift(newWish);
            activeWishes = activeWishes.slice(0, 30);
            render();
            toast('Pinned to your local wall (offline mode).');
          }
        });
      } else {
        // Local mode or fallback
        saveLocalWish(newWish);
        activeWishes.unshift(newWish);
        activeWishes = activeWishes.slice(0, 30);
        render();
        toast('Pinned to the wall. Pip yawns happily.');
      }

      if (PIP.audio.isOn()) {
        PIP.audio.note(PIP.audio.SCALE[4], { dur: 0.9, gain: 0.15 });
        PIP.audio.note(PIP.audio.SCALE[6], { dur: 1.1, gain: 0.13, when: 0.1 });
      }
    });
  }

  PIP.fx = {
    confetti: confetti,
    createNoteElement: createNoteElement,
    init: function () { initSparkles(); initOdometer(); initWall(); }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createNoteElement: createNoteElement,
      ROT: ROT,
      SEEDS: SEEDS
    };
  }
})();
