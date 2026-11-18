/* audio.js: everything you hear is synthesized live with the Web Audio API.
   Sound state is 'on' | 'off' | '' (never chosen). Nothing plays unless it is 'on'. */
(function () {
  'use strict';
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var store = PIP.store || { get: function () { return ''; }, set: function () {} };
  var toast = PIP.toast || function () {};
  var clamp = PIP.clamp || function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // C major pentatonic across ~1.6 octaves: the music box keys
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  var BASS = [261.63, 196.0, 220.0, 174.61];

  var ctx = null, master = null, reverbIn = null;
  var limiter = null, wetGain = null, convNode = null;
  var state = store.get('sound', '');
  var currentVolume = parseFloat(store.get('volume', '0.7'));
  if (isNaN(currentVolume) || currentVolume < 0 || currentVolume > 1) currentVolume = 0.7;
  var reverbWetLevel = parseFloat(store.get('reverbWet', '0.28'));
  if (isNaN(reverbWetLevel) || reverbWetLevel < 0 || reverbWetLevel > 1) reverbWetLevel = 0.28;
  var endlessTimer = 0;
  var listeners = [];

  var ambientGain = null;
  var rainSource = null, rainFilter = null;
  var cricketTimer = 0;
  var rainActive = false, cricketsActive = false;
  var windSource = null, windFilter = null, windLfo = null, windLfoGain = null;
  var windActive = false;
  var ambientLevel = parseFloat(store.get('ambientLevel', '0.5'));
  if (isNaN(ambientLevel) || ambientLevel < 0 || ambientLevel > 1) ambientLevel = 0.5;

  function isOn() { return state === 'on'; }

  function setVolume(val) {
    currentVolume = clamp(parseFloat(val), 0, 1);
    store.set('volume', currentVolume);
    if (master && ctx) {
      master.gain.setValueAtTime(currentVolume, ctx.currentTime);
    }
  }

  function getVolume() {
    return currentVolume;
  }

  function configureLimiter(opts) {
    if (!limiter || !ctx) return;
    opts = opts || {};
    var t = ctx.currentTime;
    if (typeof opts.threshold === 'number') limiter.threshold.setValueAtTime(clamp(opts.threshold, -60, 0), t);
    if (typeof opts.knee === 'number') limiter.knee.setValueAtTime(clamp(opts.knee, 0, 40), t);
    if (typeof opts.ratio === 'number') limiter.ratio.setValueAtTime(clamp(opts.ratio, 1, 20), t);
    if (typeof opts.attack === 'number') limiter.attack.setValueAtTime(clamp(opts.attack, 0.0001, 1), t);
    if (typeof opts.release === 'number') limiter.release.setValueAtTime(clamp(opts.release, 0.01, 1), t);
  }

  function setReverbWet(val) {
    reverbWetLevel = clamp(parseFloat(val), 0, 1);
    store.set('reverbWet', reverbWetLevel);
    if (wetGain && ctx) {
      wetGain.gain.setValueAtTime(reverbWetLevel, ctx.currentTime);
    }
  }

  function getReverbWet() {
    return reverbWetLevel;
  }

  function makeImpulse(c, seconds, decay) {
    var rate = (c && c.sampleRate) || 44100;
    var len = Math.max(1, Math.floor(rate * (seconds || 2.2)));
    decay = typeof decay === 'number' ? decay : 3;
    var buf = (c && c.createBuffer) ? c.createBuffer(2, len, rate) : {
      numberOfChannels: 2,
      length: len,
      sampleRate: rate,
      getChannelData: function () { return new Float32Array(len); }
    };
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
      master.gain.value = currentVolume;
      limiter = ctx.createDynamicsCompressor();
      if (limiter.threshold) limiter.threshold.value = -2.5;
      if (limiter.knee) limiter.knee.value = 0;
      if (limiter.ratio) limiter.ratio.value = 20.0;
      if (limiter.attack) limiter.attack.value = 0.002;
      if (limiter.release) limiter.release.value = 0.1;

      master.connect(limiter);
      limiter.connect(ctx.destination);

      convNode = ctx.createConvolver();
      convNode.buffer = makeImpulse(ctx, 2.2, 3);
      wetGain = ctx.createGain();
      wetGain.gain.value = reverbWetLevel;
      convNode.connect(wetGain);
      wetGain.connect(master);
      reverbIn = convNode;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // One music-box tine or configurable ADSR instrument voice.
  // When opts.adsr is provided: shapes amplitude across Attack, Decay, Sustain, Release.
  function note(freq, opts) {
    if (!isOn() || !ensure()) return;
    opts = opts || {};
    var dur = opts.dur || 1.4, gain = opts.gain || 0.22, when = opts.when || 0;
    var type = opts.type || 'sine', bell = opts.bell !== false;
    var now = ctx.currentTime;
    var t = Math.max(now, now + (when || 0));

    var g = ctx.createGain();
    g.connect(master);
    g.connect(reverbIn);

    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);

    if (opts.adsr) {
      var adsr = opts.adsr;
      var a = typeof adsr.a === 'number' ? Math.max(0.001, adsr.a) : 0.008;
      var d = typeof adsr.d === 'number' ? Math.max(0.001, adsr.d) : 0.08;
      var sRatio = typeof adsr.s === 'number' ? clamp(adsr.s, 0, 1) : 0.7;
      var r = typeof adsr.r === 'number' ? Math.max(0.001, adsr.r) : 0.3;
      var sGain = Math.max(0.0001, gain * sRatio);

      var hold = Math.max(0, dur - a - d - r);
      var tPeak = t + a;
      var tSustain = tPeak + d;
      var tReleaseStart = tSustain + hold;
      var tEnd = tReleaseStart + r;

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, tPeak);
      g.gain.linearRampToValueAtTime(sGain, tSustain);
      if (hold > 0) {
        g.gain.setValueAtTime(sGain, tReleaseStart);
      }
      g.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      o.start(t);
      o.stop(tEnd + 0.05);

      if (bell) {
        var g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.0001, t);
        g2.gain.linearRampToValueAtTime(gain * 0.35, t + Math.min(a, 0.004));
        g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(tEnd - t, dur * 0.28));
        g2.connect(master);
        var o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = freq * 2.76;
        o2.connect(g2);
        o2.start(t);
        o2.stop(t + Math.min(tEnd - t, dur * 0.3) + 0.05);
      }
    } else {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

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
  }

  // Soft ambient pad chord voice with gentle attack and long release
  function pad(freq, opts) {
    opts = opts || {};
    note(freq, {
      dur: opts.dur || 2.4,
      gain: opts.gain || 0.12,
      when: opts.when || 0,
      type: opts.type || 'sine',
      bell: false,
      adsr: opts.adsr || { a: 0.6, d: 0.4, s: 0.7, r: 1.0 }
    });
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
    if (next !== 'on') {
      stopEndless();
      stopAmbient();
      if (ctx && ctx.state === 'running' && typeof ctx.suspend === 'function') {
        ctx.suspend().catch(function () {});
      }
    } else {
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(function () {});
      }
    }
    emit();
  }
  function onChange(fn) { listeners.push(fn); }

  function ensureAmbientGain() {
    if (!ctx || !master) return null;
    if (!ambientGain) {
      ambientGain = ctx.createGain();
      ambientGain.gain.setValueAtTime(ambientLevel, ctx.currentTime);
      ambientGain.connect(master);
    }
    return ambientGain;
  }

  function setAmbientLevel(val) {
    ambientLevel = clamp(parseFloat(val), 0, 1);
    store.set('ambientLevel', ambientLevel);
    if (ambientGain && ctx) {
      ambientGain.gain.setValueAtTime(ambientLevel, ctx.currentTime);
    }
  }

  function getAmbientLevel() {
    return ambientLevel;
  }

  function makeNoiseBuffer(c, seconds) {
    var rate = c.sampleRate, len = Math.floor(rate * seconds);
    var buf = c.createBuffer(1, len, rate);
    var d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      d[i] = (b0 + b1 + b2 + white * 0.5362) * 0.18;
    }
    return buf;
  }

  function startRain() {
    if (rainSource || !isOn() || !ensure()) return false;
    var g = ensureAmbientGain();
    if (!g) return false;
    try {
      var noiseBuf = makeNoiseBuffer(ctx, 3);
      rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuf;
      rainSource.loop = true;

      rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);
      rainFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      var rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(g);

      rainSource.start();
      rainActive = true;
      return true;
    } catch (e) {
      rainSource = null;
      rainActive = false;
      return false;
    }
  }

  function stopRain() {
    if (rainSource) {
      try { rainSource.stop(); rainSource.disconnect(); } catch (e) {}
      rainSource = null;
    }
    rainActive = false;
  }

  function isRainActive() {
    return rainActive;
  }

  function chirpCricket() {
    if (!cricketsActive || !isOn() || !ctx || !ambientGain) return;
    var now = ctx.currentTime;
    var count = 2 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
      var t = now + i * 0.055;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500 + Math.random() * 200, t);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(g);
      g.connect(ambientGain);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  function startCrickets() {
    if (cricketsActive || !isOn() || !ensure()) return false;
    var g = ensureAmbientGain();
    if (!g) return false;
    cricketsActive = true;
    (function loop() {
      if (!cricketsActive || !isOn()) return;
      chirpCricket();
      cricketTimer = window.setTimeout(loop, 1800 + Math.random() * 1600);
    })();
    return true;
  }

  function stopCrickets() {
    cricketsActive = false;
    if (cricketTimer) {
      window.clearTimeout(cricketTimer);
      cricketTimer = 0;
    }
  }

  function isCricketsActive() {
    return cricketsActive;
  }

  function startWind(opts) {
    if (windSource || !isOn() || !ensure()) return false;
    var g = ensureAmbientGain();
    if (!g) return false;
    try {
      opts = opts || {};
      var lfoFreq = typeof opts.lfoFreq === 'number' ? opts.lfoFreq : 0.22;
      var noiseBuf = makeNoiseBuffer(ctx, 4);
      windSource = ctx.createBufferSource();
      windSource.buffer = noiseBuf;
      windSource.loop = true;

      windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(320, ctx.currentTime);
      windFilter.Q.setValueAtTime(3.2, ctx.currentTime);

      // Low-Frequency Oscillator (~0.15 - 0.35 Hz) sweeps the cutoff to simulate rising and fading wind gusts
      windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.setValueAtTime(lfoFreq, ctx.currentTime);

      windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(170, ctx.currentTime);

      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);

      var windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.35, ctx.currentTime);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(g);

      windLfo.start();
      windSource.start();
      windActive = true;
      return true;
    } catch (e) {
      windSource = null;
      windLfo = null;
      windLfoGain = null;
      windActive = false;
      return false;
    }
  }

  function stopWind() {
    if (windSource) {
      try { windSource.stop(); windSource.disconnect(); } catch (e) {}
      windSource = null;
    }
    if (windLfo) {
      try { windLfo.stop(); windLfo.disconnect(); } catch (e) {}
      windLfo = null;
    }
    if (windLfoGain) {
      try { windLfoGain.disconnect(); } catch (e) {}
      windLfoGain = null;
    }
    windActive = false;
  }

  function isWindActive() {
    return windActive;
  }

  function stopAmbient() {
    stopRain();
    stopCrickets();
    stopWind();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (ctx && ctx.state === 'running' && typeof ctx.suspend === 'function') {
          ctx.suspend().catch(function () {});
        }
      } else if (isOn()) {
        if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          ctx.resume().catch(function () {});
        }
      }
    });
  }

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
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      if (!isOn()) return;
      var t = e.target && e.target.closest ? e.target.closest('button, a, [data-click]') : null;
      if (!t || t.hasAttribute('data-silent')) return;
      pop();
    });
  }

  PIP.audio = {
    SCALE: SCALE,
    isOn: isOn,
    state: function () { return state; },
    toggle: toggle,
    request: request,
    note: note,
    pad: pad,
    pop: pop,
    giggle: giggle,
    startEndless: startEndless,
    stopEndless: stopEndless,
    isEndless: isEndless,
    onChange: onChange,
    setVolume: setVolume,
    getVolume: getVolume,
    startRain: startRain,
    stopRain: stopRain,
    isRainActive: isRainActive,
    startCrickets: startCrickets,
    stopCrickets: stopCrickets,
    isCricketsActive: isCricketsActive,
    startWind: startWind,
    stopWind: stopWind,
    isWindActive: isWindActive,
    stopAmbient: stopAmbient,
    setAmbientLevel: setAmbientLevel,
    getAmbientLevel: getAmbientLevel,
    configureLimiter: configureLimiter,
    setReverbWet: setReverbWet,
    getReverbWet: getReverbWet,
    makeImpulse: makeImpulse,
    masterBus: {
      configureLimiter: configureLimiter,
      setReverbWet: setReverbWet,
      getReverbWet: getReverbWet,
      makeImpulse: makeImpulse,
      getMasterNodes: function () {
        return { master: master, limiter: limiter, convolver: convNode, wet: wetGain };
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SCALE: SCALE,
      BASS: BASS,
      setVolume: setVolume,
      getVolume: getVolume,
      setAmbientLevel: setAmbientLevel,
      getAmbientLevel: getAmbientLevel,
      makeNoiseBuffer: makeNoiseBuffer,
      startWind: startWind,
      stopWind: stopWind,
      isWindActive: isWindActive,
      note: note,
      pad: pad,
      configureLimiter: configureLimiter,
      setReverbWet: setReverbWet,
      getReverbWet: getReverbWet,
      makeImpulse: makeImpulse
    };
  }
})();
