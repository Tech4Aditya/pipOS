/* audio.js: everything you hear is synthesized live with the Web Audio API.
   Sound state is 'on' | 'off' | '' (never chosen). Nothing plays unless it is 'on'. */
(function () {
  'use strict';
  var PIP = window.PIP;
  var store = PIP.store, toast = PIP.toast, clamp = PIP.clamp;

  // C major pentatonic across ~1.6 octaves: the music box keys
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  var BASS = [261.63, 196.0, 220.0, 174.61];

  var ctx = null, master = null, reverbIn = null;
  var state = store.get('sound', '');
  var endlessTimer = 0;
  var listeners = [];

  function isOn() { return state === 'on'; }

  function makeImpulse(c, seconds, decay) {
    var rate = c.sampleRate, len = Math.floor(rate * seconds);
    var buf = c.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Create the context lazily, inside a user gesture, so browsers allow it.
  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      master = ctx.createGain();
      master.gain.value = 0.7;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      var conv = ctx.createConvolver();
      conv.buffer = makeImpulse(ctx, 2.2, 3);
      var wet = ctx.createGain();
      wet.gain.value = 0.28;
      conv.connect(wet);
      wet.connect(master);
      reverbIn = conv;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // One music-box tine: a soft fundamental plus a quick inharmonic "ting".
  function note(freq, opts) {
    if (!isOn() || !ensure()) return;
    opts = opts || {};
    var dur = opts.dur || 1.4, gain = opts.gain || 0.22, when = opts.when || 0;
    var type = opts.type || 'sine', bell = opts.bell !== false;
    var t = ctx.currentTime + when;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    g.connect(reverbIn);

    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);

    if (bell) {
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(gain * 0.35, t + 0.004);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.28);
      g2.connect(master);
      var o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 2.76;
      o2.connect(g2);
      o2.start(t);
      o2.stop(t + dur * 0.3 + 0.05);
    }
  }

  // soft "pop" for ordinary clicks
  function pop() {
    var f = SCALE[Math.floor(Math.random() * 5)] * 0.75;
    note(f, { dur: 0.22, gain: 0.07, bell: false });
  }

  // Pip's giggle: a quick rising run of tiny blips
  function giggle() {
    for (var i = 0; i < 5; i++) {
      note(640 + i * 85 + Math.random() * 30, { dur: 0.14, gain: 0.1, when: i * 0.085, type: 'triangle', bell: false });
    }
  }

  // Never-ending random-walk lullaby on the pentatonic scale
  function startEndless(onNote) {
    stopEndless();
    if (!isOn()) return false;
    var idx = 2, beat = 0;
    (function step() {
      var r = Math.random();
      idx = clamp(idx + (r < 0.4 ? -1 : r < 0.8 ? 1 : r < 0.9 ? 2 : -2), 0, 7);
      if (Math.random() < 0.82) {
        note(SCALE[idx], { dur: 2.2, gain: 0.17 });
        if (onNote) onNote(idx);
      }
      if (beat % 8 === 0) note(BASS[(beat / 8) % 4], { dur: 3.2, gain: 0.13, type: 'triangle', bell: false });
      beat++;
      endlessTimer = window.setTimeout(step, 480 + Math.random() * 180);
    })();
    return true;
  }
  function stopEndless() { window.clearTimeout(endlessTimer); endlessTimer = 0; }
  function isEndless() { return endlessTimer !== 0; }

  function emit() { listeners.forEach(function (fn) { fn(state); }); }
  function set(next) {
    state = next;
    store.set('sound', next);
    if (next !== 'on') stopEndless();
    emit();
  }
  function onChange(fn) { listeners.push(fn); }

  // The speaker switch in the taskbar
  function toggle() {
    if (isOn()) { set('off'); return; }
    set('on');
    ensure();
    note(SCALE[4], { dur: 0.9, gain: 0.16 });
    note(SCALE[2], { dur: 0.9, gain: 0.14, when: 0.12 });
  }

  // Features that are explicitly about sound call this first.
  // Never chosen -> turn sound on. Chosen "off" -> respect it and say how to change it.
  function request() {
    if (state === '') { set('on'); ensure(); return true; }
    if (state === 'on') return true;
    toast('Sound is off. Flip the speaker switch up top to hear Pip.');
    return false;
  }

  // soft click sound on buttons and links (when sound is on)
  document.addEventListener('click', function (e) {
    if (!isOn()) return;
    var t = e.target && e.target.closest ? e.target.closest('button, a, [data-click]') : null;
    if (!t || t.hasAttribute('data-silent')) return;
    pop();
  });

  PIP.audio = {
    SCALE: SCALE,
    isOn: isOn,
    state: function () { return state; },
    toggle: toggle,
    request: request,
    note: note,
    pop: pop,
    giggle: giggle,
    startEndless: startEndless,
    stopEndless: stopEndless,
    isEndless: isEndless,
    onChange: onChange
  };
})();
