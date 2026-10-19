/* main.js: wires everything together. Each module is started on its own so
   one failure can never take the rest of the page down. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var $ = PIP.$, $$ = PIP.$$, store = PIP.store, clamp = PIP.clamp, reduce = PIP.reduceMotion;
  var audio = PIP.audio;

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[pip] ' + name + ' failed:', e); }
  }

  /* ---------- day / night ---------- */
  function initTheme() {
    var html = document.documentElement, btn = $('#themeBtn'), label = $('#themeLabel');
    var meta = document.querySelector('meta[name="theme-color"]');
    function apply(t) {
      html.setAttribute('data-theme', t);
      store.set('theme', t);
      if (btn) {
        btn.setAttribute('aria-label', t === 'night' ? 'Switch to day' : 'Switch to night');
        btn.classList.toggle('is-night', t === 'night');
      }
      if (label) label.textContent = t === 'night' ? 'Night' : 'Day';
      if (meta) meta.setAttribute('content', t === 'night' ? '#1b1430' : '#fff8f1');
      if (PIP.pip) PIP.pip.setMood(t === 'night' ? 'night' : 'day');
    }
    var saved = store.get('theme', '');
    var prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (prefersDark ? 'night' : 'day'));
    if (btn) btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      apply(next);
      if (audio.isOn()) {
        audio.note(audio.SCALE[next === 'night' ? 2 : 5], { dur: 1.1, gain: 0.14 });
        audio.note(audio.SCALE[next === 'night' ? 0 : 7], { dur: 1.3, gain: 0.12, when: 0.14 });
      }
    });
  }

  /* ---------- sound switch ---------- */
  function initSound() {
    var btn = $('#soundBtn'), label = $('#soundLabel');
    if (!btn) return;
    function paint(state) {
      var on = state === 'on';
      btn.classList.toggle('is-off', !on);
      btn.classList.toggle('is-hint', state === '');
      btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
      if (label) label.textContent = on ? 'Sound on' : 'Sound off';
    }
    paint(audio.state());
    audio.onChange(paint);
    btn.addEventListener('click', function () { audio.toggle(); });
    if (audio.state() === '') {
      window.setTimeout(function () {
        if (audio.state() === '') PIP.toast('Psst. Sound is off. Flip the speaker up top for chimes and giggles.', 4600);
      }, 4500);
    }
  }

  /* ---------- clock ---------- */
  function initClock() {
    var el = $('#clock');
    if (!el) return;
    function tick() {
      el.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    tick();
    window.setInterval(tick, 20000);
  }

  /* ---------- fold-up windows ---------- */
  function initFoldable() {
    $$('.win[data-foldable]').forEach(function (win, n) {
      var bar = $('.win-bar', win), body = $('.win-body', win), title = $('.win-title', win);
      if (!bar || !body) return;
      if (!body.id) body.id = 'winbody' + n;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'win-btn';
      b.setAttribute('aria-controls', body.id);
      b.setAttribute('data-silent', '');
      function paint() {
        var open = !body.hidden;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.setAttribute('aria-label', (open ? 'Fold up ' : 'Open ') + (title ? title.textContent : 'window'));
        b.textContent = open ? '−' : '+';
      }
      b.addEventListener('click', function () { body.hidden = !body.hidden; paint(); });
      bar.appendChild(b);
      paint();
    });
  }

  /* ---------- scroll story ---------- */
  function initStory() {
    var track = $('#storyTrack');
    if (!track) return;
    var stage = $('.story-stage', track), scenes = $$('.scene', track), dots = $$('.story-dot', track), bar = $('#storyBar');
    var n = scenes.length, cur = 0, ticking = false;
    if (!stage || !n) return;

    function range() { return Math.max(1, track.offsetHeight - stage.offsetHeight); }
    function stickyTop() { return parseFloat(window.getComputedStyle(stage).top) || 0; }

    function setScene(i) {
      if (i === cur) return;
      cur = i;
      scenes.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === i);
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (audio.isOn()) audio.note(audio.SCALE[[0, 2, 3, 5][i % 4]], { dur: 1.2, gain: 0.12 });
    }
    function update() {
      ticking = false;
      var r = track.getBoundingClientRect();
      var p = clamp((stickyTop() - r.top) / range(), 0, 0.9999);
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
      setScene(Math.floor(p * n));
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        var top = track.getBoundingClientRect().top + window.pageYOffset - stickyTop();
        var y = top + ((i + 0.5) / n) * range();
        window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    });
    update();
  }

  /* ---------- taskbar highlights the section you are in ---------- */
  function initNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.task-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------- the desktop trash can ---------- */
  function initTrash() {
    var t = $('#trashBtn');
    if (!t) return;
    var lines = [
      'Nightmares is empty. It has always been empty.',
      'Pip checked twice. Still empty.',
      'Only a single spare sock in there.'
    ];
    var i = 0;
    t.addEventListener('click', function () {
      PIP.toast(lines[i++ % lines.length]);
    });
  }

  /* ---------- go ---------- */
  safe('images', PIP.optionalImages);
  safe('pip', PIP.pip.init);
  safe('theme', initTheme);
  safe('sound', initSound);
  safe('clock', initClock);
  safe('foldable', initFoldable);
  safe('fx', PIP.fx.init);
  safe('toys', PIP.toys.init);
  safe('story', initStory);
  safe('navspy', initNavSpy);
  safe('trash', initTrash);
})();
