/* main.js: wires everything together. Each module is started on its own so
   one failure can never take the rest of the page down. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var $ = PIP.$, $$ = PIP.$$, store = PIP.store, clamp = PIP.clamp, reduce = PIP.reduceMotion;
  var audio = PIP.audio;
  var tr = function (text, params) { return PIP.i18n && typeof PIP.i18n.t === 'function' ? PIP.i18n.t(text, params) : text; };
  var toast = function (text, ms) { PIP.toast(tr(text), ms); };

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[pip] ' + name + ' failed:', e); }
  }

  /* ---------- day / night / auto / high contrast ---------- */
  function initTheme() {
    var html = document.documentElement, btn = $('#themeBtn'), label = $('#themeLabel');
    var cBtn = $('#contrastBtn');
    var meta = document.querySelector('meta[name="theme-color"]');
    var mode = 'auto'; // 'auto' | 'day' | 'night'
    var contrast = store.get('contrast', '') === 'on';

    function getLocalDayNight() {
      var hour = new Date().getHours();
      return (hour >= 6 && hour < 19) ? 'day' : 'night';
    }

    function resolveTheme(currentMode) {
      if (currentMode === 'day') return 'day';
      if (currentMode === 'night') return 'night';
      var prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return getLocalDayNight() || (prefersDark ? 'night' : 'day');
    }

    function apply(newMode) {
      mode = newMode;
      store.set('themeMode', mode);
      var resolved = resolveTheme(mode);
      store.set('theme', resolved);

      html.setAttribute('data-theme', contrast ? 'contrast' : resolved);
      html.setAttribute('data-theme-mode', mode);

      if (btn) {
        var ariaText = '';
        if (mode === 'auto') {
          ariaText = 'Theme mode: Auto (currently ' + (resolved === 'night' ? 'Night' : 'Day') + '), switch to Day mode';
        } else if (mode === 'day') {
          ariaText = 'Day mode, switch to Night mode';
        } else {
          ariaText = 'Night mode, switch to Auto mode';
        }

        btn.setAttribute('aria-label', ariaText);
        btn.classList.toggle('is-auto', mode === 'auto');
        btn.classList.toggle('is-night', resolved === 'night');
      }

      if (label) {
        label.textContent = (mode === 'auto') ? tr('Auto') : tr(mode === 'night' ? 'Night' : 'Day');
      }

      if (meta) meta.setAttribute('content', contrast ? '#000000' : (resolved === 'night' ? '#1b1430' : '#fff8f1'));
      if (PIP.pip) PIP.pip.setMood(resolved === 'night' ? 'night' : 'day');
    }

    function paintContrast() {
      if (!cBtn) return;
      cBtn.setAttribute('aria-pressed', contrast ? 'true' : 'false');
      cBtn.setAttribute('aria-label', contrast ? 'High contrast on, turn it off' : 'High contrast off, turn it on');
    }

    document.addEventListener('pip-language-change', function () { apply(mode); });

    var savedMode = store.get('themeMode', '');
    if (savedMode !== 'auto' && savedMode !== 'day' && savedMode !== 'night') {
      var legacySaved = store.get('theme', '');
      savedMode = (legacySaved === 'day' || legacySaved === 'night') ? legacySaved : 'auto';
    }

    apply(savedMode);
    paintContrast();

    // Check periodically for dawn/dusk transitions when in auto mode
    window.setInterval(function () {
      if (mode === 'auto') apply('auto');
    }, 60000);

    if (typeof window.matchMedia === 'function') {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
          if (mode === 'auto') apply('auto');
        });
      } catch (e) {}
    }

    if (btn) btn.addEventListener('click', function () {
      var nextMode = 'day';
      if (mode === 'auto') nextMode = 'day';
      else if (mode === 'day') nextMode = 'night';
      else if (mode === 'night') nextMode = 'auto';

      if (contrast) { contrast = false; store.set('contrast', 'off'); paintContrast(); }
      apply(nextMode);

      if (audio.isOn()) {
        var resolved = resolveTheme(nextMode);
        audio.note(audio.SCALE[resolved === 'night' ? 2 : 5], { dur: 1.1, gain: 0.14 });
        audio.note(audio.SCALE[resolved === 'night' ? 0 : 7], { dur: 1.3, gain: 0.12, when: 0.14 });
      }
    });

    if (cBtn) cBtn.addEventListener('click', function () {
      contrast = !contrast;
      store.set('contrast', contrast ? 'on' : 'off');
      apply(mode);
      paintContrast();
    });
  }
    /* ---------- quiet mode ---------- */
  function initQuiet() {
    var html = document.documentElement, btn = $('#quietBtn');
    var quiet = store.get('quiet', '') === 'on';
    function apply() {
      if (quiet) html.setAttribute('data-quiet', 'on');
      else html.removeAttribute('data-quiet');
      if (btn) {
        btn.setAttribute('aria-pressed', quiet ? 'true' : 'false');
        btn.setAttribute('aria-label', quiet ? 'Quiet mode on, turn it off' : 'Quiet mode off, turn it on');
      }
      if (quiet && audio.isOn()) audio.toggle();
    }
    apply();
    audio.onChange(function () {
      if (quiet && audio.isOn()) audio.toggle();
    });
    if (btn) btn.addEventListener('click', function () {
      quiet = !quiet;
      store.set('quiet', quiet ? 'on' : 'off');
      apply();
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
    }
    paint(audio.state());
    audio.onChange(paint);
    document.addEventListener('pip-language-change', function () { paint(audio.state()); });
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
      if (!document.hidden) {
        el.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
    }
    tick();
    window.setInterval(tick, 20000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) tick();
      });
    }
  }

  /* ---------- fold-up & minimized windows ---------- */
  function initFoldable() {
    var minDock = $('#taskbarMinimized');
    var maxZ = 10;

    function bringToFront(win) {
      if (!win) return;
      maxZ++;
      win.style.zIndex = maxZ;
      $$('.win').forEach(function (w) { w.classList.remove('win-active'); });
      win.classList.add('win-active');
    }

    $$('.win[data-foldable]').forEach(function (win, n) {
      var bar = $('.win-bar', win), body = $('.win-body', win), title = $('.win-title', win);
      if (!bar || !body) return;
      if (!body.id) body.id = 'winbody' + n;
      var b = $('.win-btn', bar);
      if (!b) {
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'win-btn';
        b.setAttribute('aria-controls', body.id);
        b.setAttribute('data-silent', '');
        bar.appendChild(b);
      }

      win.addEventListener('pointerdown', function () { bringToFront(win); });
      win.addEventListener('focusin', function () { bringToFront(win); });

      var titleText = title ? title.textContent.trim() : 'window ' + n;
      var minId = 'tb-min-' + (win.id || n);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'win-btn';
      b.setAttribute('aria-controls', body.id);
      b.setAttribute('data-silent', '');

      function updateTaskbarDock(open) {
        if (!minDock) return;
        var existing = $('#' + minId, minDock);
        if (!open) {
          if (!existing) {
            var minBtn = document.createElement('button');
            minBtn.type = 'button';
            minBtn.id = minId;
            minBtn.className = 'tb-min-btn';
            minBtn.setAttribute('aria-label', 'Restore ' + titleText);
            var iconSpan = document.createElement('span');
            iconSpan.className = 'tb-min-icon';
            iconSpan.setAttribute('aria-hidden', 'true');
            iconSpan.textContent = '🪟';
            var titleSpan = document.createElement('span');
            titleSpan.className = 'tb-min-title';
            titleSpan.textContent = titleText;
            minBtn.appendChild(iconSpan);
            minBtn.appendChild(titleSpan);
            minBtn.addEventListener('click', function () {
              body.hidden = false;
              win.classList.remove('is-folded');
              paint();
              bringToFront(win);
              win.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              b.focus();
            });
            minDock.appendChild(minBtn);
          }
        } else {
          if (existing) existing.remove();
        }
      }

      function paint() {
        var open = !body.hidden && !win.classList.contains('is-minimized');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.setAttribute('aria-label', (open ? 'Minimize ' : 'Restore ') + (title ? title.textContent : 'window'));
        b.setAttribute('aria-label', (open ? 'Fold up ' : 'Open ') + titleText);
        b.textContent = open ? '−' : '+';
        win.classList.toggle('is-folded', !open);
        updateTaskbarDock(open);
      }
      b.addEventListener('click', function (e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        var open = !body.hidden && !win.classList.contains('is-minimized');
        if (open) {
          if (PIP.taskbar && typeof PIP.taskbar.minimizeWindow === 'function') {
            PIP.taskbar.minimizeWindow(win);
          } else {
            body.hidden = true;
            win.classList.add('is-minimized');
            paint();
          }
        } else {
          if (PIP.taskbar && typeof PIP.taskbar.restoreWindow === 'function') {
            PIP.taskbar.restoreWindow(win);
          } else {
            body.hidden = false;
            win.classList.remove('is-minimized');
            paint();
          }
        }
      });

      b.addEventListener('click', function () {
        body.hidden = !body.hidden;
        paint();
        if (!body.hidden) {
          bringToFront(win);
        }
      });

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
      } else if (e.key === 'f' || e.key === 'F') {
        if (PIP.flashlight && typeof PIP.flashlight.toggle === 'function') {
          PIP.flashlight.toggle();
        }
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

    var stickerLink = $('.desk-icons a[href="#stickers"]');
    if (stickerLink) {
      stickerLink.addEventListener('click', function () {
        var win = $('#stickers');
        if (win) {
          var body = $('.win-body', win);
          if (body && body.hidden) {
            var btn = $('.win-btn', win);
            if (btn) btn.click();
            else body.hidden = false;
          }
        }
      });
    }
  }

  /* ---------- bedtime storybook ---------- */
  function initStory() {
    var track = $('#storyTrack');
    if (!track) return;
    var book = $('#storyPages'), scenes = $$('.scene', track), dots = $$('.story-dot', track);
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
      d.addEventListener('click', function () {
        setScene(i);
        if (scenes[i]) {
          if (scenes[i].scrollIntoView) {
            scenes[i].scrollIntoView({ behavior: reduce && reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
          }
          if (scenes[i].focus) scenes[i].focus({ preventScroll: true });
        }
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
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var touch = e.changedTouches[0];
      startX = touch.clientX; startY = touch.clientY;
    }, { passive: true });
    book.addEventListener('touchend', function (e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
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
  safe('quiet', initQuiet);
  safe('clock', initClock);
  safe('foldable', initFoldable);
  safe('wm', PIP.wm && PIP.wm.init);
  safe('shortcuts', initShortcuts);
  safe('stickers', PIP.stickers && PIP.stickers.init);
  safe('fx', PIP.fx.init);
  safe('toys', PIP.toys.init);
  safe('stars', PIP.stars && PIP.stars.init);
  safe('rattle', PIP.rattle && PIP.rattle.init);
  safe('drag', PIP.drag && PIP.drag.init);
  safe('haptics', PIP.haptics && PIP.haptics.init);
  safe('recorder', PIP.recorder && PIP.recorder.init);
  safe('story', initStory);
  safe('dressup', PIP.dressup ? PIP.dressup.init : function () {});
  safe('navspy', initNavSpy);
  safe('flashlight', PIP.flashlight ? PIP.flashlight.init : function () {});
  safe('trash', initTrash);
  safe('sw', initServiceWorker);
})();
