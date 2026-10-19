/* toys.js: Lullaby Lab, Nightlight Collection, Rattle & Blocks, Dream Delivery. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var $ = PIP.$, $$ = PIP.$$, store = PIP.store, clamp = PIP.clamp, toast = PIP.toast;
  var reduce = PIP.reduceMotion, audio = PIP.audio;

  /* =====================================================================
     1. LULLABY LAB
     ===================================================================== */
  function initLab() {
    var keysEl = $('#keys'), stage = $('#mbStage'), wind = $('#windBtn'), endless = $('#endlessBtn');
    if (!keysEl || !stage || !wind || !endless) return;

    var NAMES = ['C', 'D', 'E', 'G', 'A', 'high C', 'high D', 'high E'];
    var PAL = ['#ff9fb4', '#ffd27a', '#9fd8c4', '#9ab8f0', '#d3a8f2', '#ffb08a', '#8fd3e8', '#c7e58a'];
    var buttons = [];
    var labVisible = false;

    NAMES.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.setAttribute('data-silent', '');
      b.setAttribute('aria-label', 'Note ' + n + ', key ' + (i + 1));
      b.style.setProperty('--k', PAL[i]);
      b.innerHTML = '<span aria-hidden="true">' + (i + 1) + '</span>';
      b.addEventListener('click', function () { press(i); });
      keysEl.appendChild(b);
      buttons.push(b);
    });

    function flash(i) {
      var b = buttons[i];
      b.classList.add('is-down');
      window.setTimeout(function () { b.classList.remove('is-down'); }, 180);
      if (reduce.matches) return;
      var f = document.createElement('span');
      f.className = 'float';
      f.textContent = '✦';
      f.style.left = ((i + 0.5) / 8 * 100) + '%';
      f.style.color = PAL[i];
      f.addEventListener('animationend', function () { f.remove(); });
      stage.appendChild(f);
    }

    function press(i) {
      flash(i);
      if (audio.request()) audio.note(audio.SCALE[i], { dur: 1.6, gain: 0.24 });
    }

    // number keys 1-8 while the lab is on screen (and you're not typing)
    document.addEventListener('keydown', function (e) {
      if (!labVisible || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 8) press(n - 1);
    });
    PIP.watchVisible($('#lab'), function (v) { labVisible = v; }, '0px');

    // an original little tune; -1 is a rest
    var TUNE = [0, 2, 4, 2, 3, 1, 0, -1, 2, 4, 5, 4, 3, 2, 1, -1, 4, 5, 7, 5, 4, 2, 3, 1, 0, -1, -1, -1];
    var playing = false, timers = [];

    function stopTune() {
      timers.forEach(window.clearTimeout);
      timers = [];
      playing = false;
      wind.textContent = 'Wind the box';
    }
    function playTune() {
      if (!audio.request()) return;
      if (audio.isEndless()) stopEndlessUi();
      playing = true;
      wind.textContent = 'Stop the box';
      TUNE.forEach(function (n, step) {
        timers.push(window.setTimeout(function () {
          if (n >= 0) press(n);
          if (step === TUNE.length - 1) stopTune();
        }, step * 430));
      });
    }
    wind.addEventListener('click', function () { if (playing) stopTune(); else playTune(); });

    function stopEndlessUi() {
      audio.stopEndless();
      endless.textContent = 'Endless lullaby';
      endless.classList.remove('is-on');
    }
    endless.addEventListener('click', function () {
      if (audio.isEndless()) { stopEndlessUi(); return; }
      if (!audio.request()) return;
      if (playing) stopTune();
      audio.startEndless(flash);
      endless.textContent = 'Stop lullaby';
      endless.classList.add('is-on');
    });

    // muting from the taskbar stops everything the lab is doing
    audio.onChange(function (s) {
      if (s !== 'on') { stopTune(); stopEndlessUi(); }
    });
  }

  /* =====================================================================
     2. NIGHTLIGHT COLLECTION (flashlight dark room)
     ===================================================================== */
  function initLights() {
    var room = $('#darkroom'), lanternsEl = $('#lanterns'), trayN = $('#trayN');
    if (!room || !lanternsEl) return;
    var items = $$('[data-item]', room);

    var LANTERNS = [
      { name: 'Moon', glow: '#cfe3ff', r: 92 },
      { name: 'Honey', glow: '#ffc866', r: 112 },
      { name: 'Rose', glow: '#ff9fc0', r: 80 },
      { name: 'Mint', glow: '#9ff0d0', r: 100 }
    ];
    var cur = 0, x = 0, y = 0, r = LANTERNS[0].r, found = 0;
    var lastMove = 0, visible = false;

    function paint() {
      room.style.setProperty('--x', x.toFixed(0) + 'px');
      room.style.setProperty('--y', y.toFixed(0) + 'px');
    }
    function setLantern(i) {
      cur = i;
      r = LANTERNS[i].r;
      room.style.setProperty('--r', r + 'px');
      room.style.setProperty('--glow', LANTERNS[i].glow);
      $$('.lantern', lanternsEl).forEach(function (b, j) {
        b.setAttribute('aria-checked', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
      });
    }
    LANTERNS.forEach(function (l, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lantern';
      b.setAttribute('role', 'radio');
      b.style.setProperty('--c', l.glow);
      b.innerHTML = '<i aria-hidden="true"></i><span>' + l.name + '</span>';
      b.addEventListener('click', function () { setLantern(i); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (cur + d + LANTERNS.length) % LANTERNS.length;
        setLantern(n);
        $$('.lantern', lanternsEl)[n].focus();
      });
      lanternsEl.appendChild(b);
    });

    function center() {
      var b = room.getBoundingClientRect();
      x = b.width / 2;
      y = b.height / 2;
    }
    function toLocal(e) {
      var b = room.getBoundingClientRect();
      x = clamp(e.clientX - b.left, 0, b.width);
      y = clamp(e.clientY - b.top, 0, b.height);
      lastMove = performance.now();
      paint();
    }
    room.addEventListener('pointermove', toLocal);
    room.addEventListener('pointerdown', function (e) {
      toLocal(e);
      tryFind();
    });
    room.addEventListener('keydown', function (e) {
      var b = room.getBoundingClientRect(), step = 28;
      if (e.key === 'ArrowLeft') x = clamp(x - step, 0, b.width);
      else if (e.key === 'ArrowRight') x = clamp(x + step, 0, b.width);
      else if (e.key === 'ArrowUp') y = clamp(y - step, 0, b.height);
      else if (e.key === 'ArrowDown') y = clamp(y + step, 0, b.height);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryFind(); return; }
      else return;
      e.preventDefault();
      lastMove = performance.now();
      paint();
      tryFind();
    });

    // a dream is found when the lit circle covers it and you click, tap or press Enter
    function tryFind() {
      var rb = room.getBoundingClientRect();
      items.forEach(function (it) {
        if (it.classList.contains('is-found')) return;
        var ib = it.getBoundingClientRect();
        var ix = ib.left + ib.width / 2 - rb.left, iy = ib.top + ib.height / 2 - rb.top;
        if (Math.hypot(ix - x, iy - y) < Math.max(34, r * 0.55)) {
          it.classList.add('is-found');
          found += 1;
          trayN.textContent = found + ' of ' + items.length + ' dreams found';
          if (audio.isOn()) audio.note(audio.SCALE[Math.min(found + 2, 7)], { dur: 1.2, gain: 0.18 });
          if (found === items.length) {
            toast('All five dreams found. Pip is very proud.');
            room.classList.add('is-done');
            if (audio.isOn()) audio.giggle();
          }
        }
      });
    }

    // when you aren't pointing, the lantern drifts on its own
    var t0 = performance.now(), raf = 0;
    function drift(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - lastMove > 2500 && !reduce.matches) {
        var b = room.getBoundingClientRect(), t = (now - t0) / 1000;
        x = b.width * (0.5 + 0.36 * Math.sin(t * 0.55));
        y = b.height * (0.5 + 0.32 * Math.sin(t * 0.83 + 1));
        paint();
      }
      raf = window.requestAnimationFrame(drift);
    }
    PIP.watchVisible(room, function (v) {
      visible = v;
      if (v && !raf) raf = window.requestAnimationFrame(drift);
    });

    window.addEventListener('resize', function () { if (performance.now() - lastMove > 2500) { center(); paint(); } });
    setLantern(0);
    center();
    paint();
  }

  /* =====================================================================
     3. RATTLE & BLOCKS (stacker)
     ===================================================================== */
  function initBlocks() {
    var cv = $('#blockCanvas'), btn = $('#blockDrop'), scoreEl = $('#blockScore');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = 300, H = 420, BH = 28;
    var PAL = ['#ff9fb4', '#ffd27a', '#9fd8c4', '#9ab8f0', '#d3a8f2', '#ffb08a'];
    var LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr;
    cv.height = H * dpr;

    var st, raf = 0, visible = false, last = 0;
    var best = parseInt(store.get('best', '0'), 10) || 0;

    function rr(x, y, w, h, rad) {
      rad = Math.min(rad, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    function levelY(i) { return H - 10 - (i + 1) * BH; } // world y of block i's top

    function reset() {
      st = { stack: [{ x: 70, w: 160, i: 0 }], cur: null, chips: [], score: 0, over: false, cam: 0 };
      spawn();
      hud();
      if (!raf && visible) loop();
    }
    function spawn() {
      var top = st.stack[st.stack.length - 1];
      var dir = st.stack.length % 2 ? 1 : -1;
      st.cur = { x: dir > 0 ? 0 : W - top.w, w: top.w, dir: dir, i: st.stack.length };
    }
    function hud() {
      scoreEl.textContent = 'Height ' + st.score + ', best ' + best;
    }

    function drop() {
      if (st.over) { reset(); return; }
      var top = st.stack[st.stack.length - 1], c = st.cur;
      var left = Math.max(c.x, top.x), right = Math.min(c.x + c.w, top.x + top.w), ov = right - left;
      if (ov < 3) {
        st.chips.push({ x: c.x, w: c.w, y: levelY(c.i), vy: 0, i: c.i });
        st.cur = null;
        st.over = true;
        if (st.score > best) { best = st.score; store.set('best', best); }
        hud();
        toast('Wobbly! Your tower is ' + st.score + ' blocks tall.');
        if (audio.isOn()) audio.note(196, { dur: 0.6, gain: 0.2, type: 'triangle', bell: false });
        return;
      }
      var perfect = Math.abs(c.x - top.x) < 5, nx = c.x, nw = c.w;
      if (perfect) { nx = top.x; nw = top.w; }
      else {
        if (c.x < top.x) st.chips.push({ x: c.x, w: top.x - c.x, y: levelY(c.i), vy: 0, i: c.i });
        else st.chips.push({ x: top.x + top.w, w: c.x + c.w - (top.x + top.w), y: levelY(c.i), vy: 0, i: c.i });
        nx = left;
        nw = ov;
      }
      st.stack.push({ x: nx, w: nw, i: c.i });
      st.score += 1;
      if (audio.isOn()) {
        var f = audio.SCALE[st.score % 5] * (st.score % 10 < 5 ? 1 : 1.5);
        audio.note(f, { dur: perfect ? 1.4 : 0.8, gain: perfect ? 0.22 : 0.15 });
        if (perfect) audio.note(f * 1.5, { dur: 1.2, gain: 0.1, when: 0.07 });
      }
      if (st.score > best) { best = st.score; store.set('best', best); }
      hud();
      spawn();
    }

    function update(dt) {
      if (!st.over && st.cur) {
        var c = st.cur, speed = Math.min(120 + st.score * 8, 340);
        c.x += c.dir * speed * dt;
        if (c.x < 0) { c.x = 0; c.dir = 1; }
        if (c.x + c.w > W) { c.x = W - c.w; c.dir = -1; }
      }
      var target = Math.max(0, st.stack.length - 9) * BH;
      st.cam += (target - st.cam) * Math.min(1, dt * 6);
      st.chips.forEach(function (p) { p.vy += 900 * dt; p.y += p.vy * dt; });
      st.chips = st.chips.filter(function (p) { return p.y < H + st.cam + 60; });
    }

    function block(b, y, idx, alpha) {
      var col = PAL[idx % PAL.length];
      ctx.globalAlpha = alpha || 1;
      rr(b.x, y, b.w, BH - 2, 7);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#5c4033';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      rr(b.x + 4, y + 3, b.w - 8, 6, 3);
      ctx.fill();
      if (b.w > 34) {
        ctx.fillStyle = '#5c4033';
        ctx.font = '600 15px Fredoka, "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(LET.charAt(idx % LET.length), b.x + b.w / 2, y + BH / 2);
      }
      ctx.globalAlpha = 1;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // floor
      ctx.fillStyle = 'rgba(92,64,51,.18)';
      ctx.fillRect(0, H - 10 + st.cam, W, 10 + 400);
      st.stack.forEach(function (b, i) { block(b, levelY(i) + st.cam, i); });
      st.chips.forEach(function (p) { block(p, p.y + st.cam, p.i, 0.9); });
      if (st.cur) block(st.cur, levelY(st.cur.i) + st.cam, st.cur.i);
      if (st.over || st.score === 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (st.over) {
          ctx.fillStyle = 'rgba(40,24,40,.55)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff8f1';
          ctx.font = '600 26px Fredoka, system-ui, sans-serif';
          ctx.fillText('Wobbly! ' + st.score + ' tall', W / 2, H / 2 - 12);
          ctx.font = '500 16px Fredoka, system-ui, sans-serif';
          ctx.fillText('Tap to build again', W / 2, H / 2 + 20);
        } else {
          ctx.fillStyle = 'rgba(92,64,51,.7)';
          ctx.font = '500 15px Fredoka, system-ui, sans-serif';
          ctx.fillText('Tap to drop the block', W / 2, 40);
        }
      }
    }

    function loop() {
      raf = window.requestAnimationFrame(function (now) {
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        update(dt);
        draw();
        if (visible && !document.hidden) loop(); else raf = 0;
      });
    }

    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drop(); });
    cv.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(); }
    });
    if (btn) btn.addEventListener('click', drop);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && visible && !raf) { last = performance.now(); loop(); }
    });
    PIP.watchVisible(cv, function (v) {
      visible = v;
      if (v && !raf) { last = performance.now(); loop(); }
    });

    reset();
    draw();
  }

  /* =====================================================================
     4. DREAM DELIVERY ROUTE (SVG path synced to scroll)
     ===================================================================== */
  function initRoute() {
    var win = $('#route'), path = $('#routePath'), rider = $('#rider'), label = $('#routeLabel'), btn = $('#flyBtn');
    if (!win || !path || !rider || !path.getTotalLength) return;
    var houses = $$('#routeSvg .house');
    var len = path.getTotalLength();
    var p = 0, manual = false;

    // progress at which the route passes each house
    var samples = [];
    for (var i = 0; i <= 240; i++) samples.push(path.getPointAtLength(len * i / 240).x);
    var at = houses.map(function (h) {
      var hx = parseFloat(h.getAttribute('data-x'));
      for (var j = 0; j < samples.length; j++) if (samples[j] >= hx) return j / 240;
      return 1;
    });

    function set(v) {
      p = clamp(v, 0, 1);
      var pt = path.getPointAtLength(len * p);
      rider.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      var passed = -1;
      houses.forEach(function (h, k) {
        var on = p >= at[k];
        h.classList.toggle('is-lit', on);
        if (on) passed = k;
      });
      if (p <= 0.01) label.textContent = 'Waiting at the nursery window';
      else if (p >= 0.995) label.textContent = 'All seven dreams delivered';
      else if (passed >= 0) label.textContent = 'Delivered to ' + houses[passed].getAttribute('data-name');
      else label.textContent = 'Taking off...';
    }

    function fromScroll() {
      if (manual) return;
      var r = win.getBoundingClientRect(), vh = window.innerHeight;
      set((vh * 0.85 - r.top) / (vh * 0.65));
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; fromScroll(); });
    }, { passive: true });
    window.addEventListener('resize', fromScroll);

    btn.addEventListener('click', function () {
      if (reduce.matches) { set(p >= 0.99 ? 0 : 1); return; }
      manual = true;
      var t0 = performance.now(), dur = 5200;
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
        set(e);
        if (k < 1) window.requestAnimationFrame(step);
        else window.setTimeout(function () { manual = false; }, 1500);
      })(t0);
      if (audio.isOn()) {
        [0, 2, 4, 3, 5, 4, 7].forEach(function (n, k) {
          audio.note(audio.SCALE[n], { dur: 1.2, gain: 0.12, when: 0.4 + k * 0.7 });
        });
      }
    });

    fromScroll();
  }

  PIP.toys = {
    init: function () { initLab(); initLights(); initBlocks(); initRoute(); }
  };
})();
