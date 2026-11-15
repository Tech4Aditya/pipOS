/* main.js: wires everything together. Each module is started on its own so
   one failure can never take the rest of the page down. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var $ = PIP.$, $$ = PIP.$$, store = PIP.store, clamp = PIP.clamp, reduce = PIP.reduceMotion;
  var audio = PIP.audio;
  var tr = function (text) { return PIP.i18n && typeof PIP.i18n.t === 'function' ? PIP.i18n.t(text) : text; };
  var toast = function (text, ms) { PIP.toast(tr(text), ms); };

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[pip] ' + name + ' failed:', e); }
  }

  /* ---------- day / night / high contrast ---------- */
  function initTheme() {
    var html = document.documentElement, btn = $('#themeBtn'), label = $('#themeLabel');
    var cBtn = $('#contrastBtn');
    var meta = document.querySelector('meta[name="theme-color"]');
    var base = 'day';
    var contrast = store.get('contrast', '') === 'on';

    function apply(t) {
      base = t;
      store.set('theme', t);
      html.setAttribute('data-theme', contrast ? 'contrast' : t);
      if (btn) {
        btn.setAttribute('aria-label', t === 'night' ? 'Night mode, switch to day mode' : 'Day mode, switch to night mode');
        btn.classList.toggle('is-night', t === 'night');
      }
      if (label) label.textContent = tr(t === 'night' ? 'Night' : 'Day');
      if (meta) meta.setAttribute('content', contrast ? '#000000' : (t === 'night' ? '#1b1430' : '#fff8f1'));
      if (PIP.pip) PIP.pip.setMood(t === 'night' ? 'night' : 'day');
    }

    function paintContrast() {
      if (!cBtn) return;
      cBtn.setAttribute('aria-pressed', contrast ? 'true' : 'false');
      cBtn.setAttribute('aria-label', contrast ? 'High contrast on, turn it off' : 'High contrast off, turn it on');
    }

    document.addEventListener('pip-language-change', function () { apply(base); });
    var saved = store.get('theme', '');
    if (saved !== 'day' && saved !== 'night') saved = '';
    var prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (prefersDark ? 'night' : 'day'));
    paintContrast();

    if (btn) btn.addEventListener('click', function () {
      var next = base === 'night' ? 'day' : 'night';
      if (contrast) { contrast = false; store.set('contrast', 'off'); paintContrast(); }
      apply(next);
      if (audio.isOn()) {
        audio.note(audio.SCALE[next === 'night' ? 2 : 5], { dur: 1.1, gain: 0.14 });
        audio.note(audio.SCALE[next === 'night' ? 0 : 7], { dur: 1.3, gain: 0.12, when: 0.14 });
      }
    });

    if (cBtn) cBtn.addEventListener('click', function () {
      contrast = !contrast;
      store.set('contrast', contrast ? 'on' : 'off');
      apply(base);
      paintContrast();
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
      btn.setAttribute('aria-label', tr(on ? 'Turn sound off' : 'Turn sound on'));
      if (label) label.textContent = tr(on ? 'Sound on' : 'Sound off');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Sound on, turn sound off' : 'Sound off, turn sound on');
      if (label) label.textContent = on ? 'Sound on' : 'Sound off';
    }
    paint(audio.state());
    audio.onChange(paint);
    btn.addEventListener('click', function () { audio.toggle(); });
    if (audio.state() === '') {
      window.setTimeout(function () {
        if (audio.state() === '') toast('Psst. Sound is off. Flip the speaker up top for chimes and giggles.', 4600);
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

  /* ---------- shortcuts cheat sheet (keys.txt) ---------- */
  function initShortcuts() {
    var win = $('#shortcuts');
    if (!win) return;
    var body = $('.win-body', win);

    function toggleShortcuts(openOnly) {
      var btn = $('.win-btn', win);
      var isCurrentlyOpen = body && !body.hidden;
      var isFocused = win.contains(document.activeElement);

      if (!isCurrentlyOpen) {
        if (btn) btn.click();
        else if (body) body.hidden = false;
        if (win.scrollIntoView) {
          win.scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
        }
        if (btn) btn.focus();
      } else if (openOnly) {
        if (win.scrollIntoView) {
          win.scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
        }
        if (btn) btn.focus();
      } else if (isFocused) {
        if (btn) btn.click();
        else if (body) body.hidden = true;
      } else {
        if (win.scrollIntoView) {
          win.scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
        }
        if (btn) btn.focus();
      }
    }

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable]')) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        toggleShortcuts(false);
      } else if (e.key === 'Escape' && body && !body.hidden && win.contains(document.activeElement)) {
        var btn = $('.win-btn', win);
        if (btn) btn.click();
      }
    });

    var iconLink = $('.desk-icons a[href="#shortcuts"]');
    if (iconLink) {
      iconLink.addEventListener('click', function () {
        toggleShortcuts(true);
      });
    }
  }

  /* ---------- bedtime storybook ---------- */
  function initStory() {
    var track = $('#storyTrack');
    if (!track) return;
    var book = $('#storybook'), scenes = $$('.scene', track), dots = $$('.story-dot', track);
    var prev = $('#storyPrev'), next = $('#storyNext'), count = $('#storyCount');
    var n = scenes.length, cur = -1, startX = 0, startY = 0;
    if (!book || !n) return;
    function setScene(i) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === cur && scenes[i].classList.contains('is-active')) return;
      var direction = i > cur ? 'forward' : 'back';
      cur = i;
      scenes.forEach(function (s, k) {
        var active = k === i;
        s.classList.toggle('is-active', active);
        if (active) {
          s.removeAttribute('aria-hidden');
          s.removeAttribute('inert');
        } else {
          s.setAttribute('aria-hidden', 'true');
          s.setAttribute('inert', '');
        }
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === i);
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (count) count.textContent = 'Page ' + (i + 1) + ' of ' + n;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      if (audio.isOn()) audio.note(audio.SCALE[[0, 2, 3, 5][i % 4]], { dur: 1.2, gain: 0.12 });
    }
    function move(step) { setScene(cur + step); }
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { setScene(i); });
      d.addEventListener('click', function () {
        var top = track.getBoundingClientRect().top + window.pageYOffset - stickyTop();
        var y = top + ((i + 0.5) / n) * range();
        window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
        if (scenes[i] && scenes[i].focus) scenes[i].focus({ preventScroll: true });
      });
      d.addEventListener('keydown', function (e) {
        var nextDot = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextDot = Math.min(n - 1, i + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextDot = Math.max(0, i - 1);
        if (nextDot !== i && nextDot >= 0) {
          e.preventDefault();
          dots[nextDot].focus();
          dots[nextDot].click();
        }
      });
    });
    book.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      if (e.key === 'Home') { e.preventDefault(); setScene(0); }
      if (e.key === 'End') { e.preventDefault(); setScene(n - 1); }
    });
    book.addEventListener('touchstart', function (e) {
      var touch = e.changedTouches[0];
      startX = touch.clientX; startY = touch.clientY;
    }, { passive: true });
    book.addEventListener('touchend', function (e) {
      var touch = e.changedTouches[0], dx = touch.clientX - startX, dy = touch.clientY - startY;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      move(dx < 0 ? 1 : -1);
    }, { passive: true });
    setScene(0);
  }

  /* ---------- taskbar highlights the section you are in ---------- */
  function initNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.task-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var currentSection = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) a.setAttribute('aria-current', 'true');

        // When scrolling to a new section, Pip glances toward it with a tiny head nudge
        if (currentSection && currentSection !== e.target.id) {
          if (PIP.pip && (!reduce || !reduce.matches)) {
            if (typeof PIP.pip.glance === 'function') {
              PIP.pip.glance(e.target);
            } else if (typeof PIP.pip.look === 'function') {
              var r = e.target.getBoundingClientRect();
              PIP.pip.look(r.left + r.width / 2, r.top + Math.min(r.height * 0.35, 200));
            }
          }
        }
        currentSection = e.target.id;
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
      toast(lines[i++ % lines.length]);
    });
  }

  /* ---------- service worker registration ---------- */
  function initServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function (err) {
          if (window.console && window.console.debug) console.debug('[pip] ServiceWorker registration skipped:', err);
        });
      });
    }
  }

  /* ---------- go ---------- */
  safe('images', PIP.optionalImages);
  safe('i18n', PIP.i18n ? PIP.i18n.init : function () {});
  safe('pip', PIP.pip.init);
  safe('theme', initTheme);
  safe('sound', initSound);
  safe('clock', initClock);
  safe('foldable', initFoldable);
  safe('shortcuts', initShortcuts);
  safe('fx', PIP.fx.init);
  safe('toys', PIP.toys.init);
  safe('story', initStory);
  safe('navspy', initNavSpy);
  safe('trash', initTrash);
  safe('sw', initServiceWorker);
})();
