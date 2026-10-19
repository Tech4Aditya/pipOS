/* pip.js: Pip's eyes, blinks, moods, greeting and the hidden gold star. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var $ = PIP.$, store = PIP.store, clamp = PIP.clamp, reduce = PIP.reduceMotion;

  var svg, head, egg, bubble, secret;
  var eyes = [];
  var lastPointer = 0;
  var mood = 'day';
  var awakeTimer = 0;
  var MAX_X = 14, MAX_Y = 18;

  /* ---------- eyes follow the pointer (touch drags count too) ---------- */
  function look(x, y) {
    for (var i = 0; i < eyes.length; i++) {
      var r = eyes[i].sock.getBoundingClientRect();
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(d / 170, 1);
      eyes[i].el.style.transform = 'translate(' + ((dx / d) * k * MAX_X).toFixed(1) + 'px,' + ((dy / d) * k * MAX_Y).toFixed(1) + 'px)';
    }
    // head tilts a touch toward the pointer
    var vx = (x / window.innerWidth - 0.5) * 2, vy = (y / window.innerHeight - 0.5) * 2;
    head.style.transform = 'translate(' + (vx * 5).toFixed(1) + 'px,' + (vy * 3).toFixed(1) + 'px) rotate(' + (vx * 3.5).toFixed(2) + 'deg)';
  }

  var pending = null, raf = 0;
  function onPointer(e) {
    lastPointer = performance.now();
    pending = { x: e.clientX, y: e.clientY };
    if (!raf) raf = window.requestAnimationFrame(function () {
      raf = 0;
      if (pending) look(pending.x, pending.y);
    });
  }

  // when nobody is moving, Pip looks around by itself
  function idleLoop() {
    window.setTimeout(function () {
      if (performance.now() - lastPointer > 3500 && !document.hidden) {
        var r = svg.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        look(cx + (Math.random() - 0.5) * 520, cy + (Math.random() - 0.5) * 360);
      }
      idleLoop();
    }, 1600 + Math.random() * 1800);
  }

  function blinkLoop() {
    window.setTimeout(function () {
      svg.classList.add('is-blink');
      window.setTimeout(function () { svg.classList.remove('is-blink'); }, 140);
      blinkLoop();
    }, 2400 + Math.random() * 3600);
  }

  /* ---------- moods ---------- */
  function setMood(m) {
    mood = m;
    svg.classList.toggle('is-night', m === 'night');
  }
  function wake(ms) {
    svg.classList.add('is-awake');
    window.clearTimeout(awakeTimer);
    awakeTimer = window.setTimeout(function () { svg.classList.remove('is-awake'); }, ms || 4500);
  }

  /* ---------- greeting remembers returning visitors ---------- */
  function greet() {
    if (!bubble) return;
    var visits = parseInt(store.get('visits', '0'), 10) || 0;
    visits += 1;
    store.set('visits', visits);
    var who = store.get('visitor', '');
    if (visits === 1) bubble.textContent = "Hi! I'm Pip.";
    else if (who) bubble.textContent = 'Welcome back, ' + who + '! Visit number ' + visits + '.';
    else bubble.textContent = 'You came back! Visit number ' + visits + '.';
  }

  /* ---------- hidden gold star: tap it five times ---------- */
  var taps = 0, tapTimer = 0;
  function openSecret() {
    if (!secret) return;
    if (typeof secret.showModal === 'function') {
      if (!secret.open) secret.showModal();
    } else secret.setAttribute('open', '');
    var close = $('#secretClose');
    if (close) close.focus();
  }
  function closeSecret() {
    if (!secret) return;
    if (typeof secret.close === 'function') secret.close();
    else secret.removeAttribute('open');
    if (egg && egg.focus) egg.focus({ preventScroll: true });
  }

  function onEgg() {
    taps += 1;
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(function () { taps = 0; }, 1600);
    var star = egg.querySelector('.egg-star');
    star.classList.remove('is-wiggle');
    void star.getBoundingClientRect(); // restart the wiggle animation
    star.classList.add('is-wiggle');
    if (PIP.audio.isOn()) PIP.audio.note(PIP.audio.SCALE[Math.min(taps + 1, 7)], { dur: 0.7, gain: 0.14 });
    if (taps === 3) PIP.toast('Pip stirs in their sleep...');
    if (taps >= 5) {
      taps = 0;
      wake(5200);
      PIP.fx.confetti(170);
      if (PIP.audio.isOn()) {
        PIP.audio.giggle();
        [0, 2, 4, 5, 7].forEach(function (n, i) {
          PIP.audio.note(PIP.audio.SCALE[n], { dur: 1.3, gain: 0.15, when: 0.5 + i * 0.16 });
        });
      }
      openSecret();
    }
  }

  function init() {
    svg = $('#pipSvg');
    if (!svg) return;
    head = $('#pipHead');
    egg = $('#egg');
    bubble = $('#greeting');
    secret = $('#secret');
    eyes = [
      { el: $('#pupilL'), sock: svg.querySelectorAll('.p-socket')[0] },
      { el: $('#pupilR'), sock: svg.querySelectorAll('.p-socket')[1] }
    ];
    if (!head || !eyes[0].el || !eyes[1].el || !eyes[0].sock || !eyes[1].sock) return;

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    idleLoop();
    blinkLoop();
    greet();

    var hi = $('#sayHi');
    if (hi) hi.addEventListener('click', function () {
      wake(2600);
      if (PIP.audio.isOn()) PIP.audio.giggle();
      else PIP.toast('Pip giggles. (Turn sound on to hear it.)');
      svg.classList.remove('is-wave');
      void svg.getBoundingClientRect();
      svg.classList.add('is-wave');
      window.setTimeout(function () { svg.classList.remove('is-wave'); }, 2300);
    });

    if (egg) {
      egg.addEventListener('click', onEgg);
      egg.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEgg(); }
      });
    }
    var close = $('#secretClose');
    if (close) close.addEventListener('click', closeSecret);
    if (secret) {
      secret.addEventListener('click', function (e) { if (e.target === secret) closeSecret(); });
      secret.addEventListener('close', function () { if (egg && egg.focus) egg.focus({ preventScroll: true }); });
    }
  }

  PIP.pip = { init: init, setMood: setMood, wake: wake, getMood: function () { return mood; } };
})();
