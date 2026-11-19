/**
 * PipOS Procedural Ambience Generator (Ocean, Rain & Thunder)
 * Pure vanilla Web Audio procedural sound synthesis for bedtime relaxation.
 * Zero external dependencies. IEEE IGDTUW Open Source Week 10.0.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PipAmbience = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function clamp(val, min = 0, max = 1) {
    const num = parseFloat(val);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  function createAmbienceState() {
    return {
      rainVolume: 0.5,
      oceanVolume: 0.5,
      thunderVolume: 0.5,
      isRainPlaying: false,
      isOceanPlaying: false,
      isThunderPlaying: false
    };
  }

  let audioCtx = null;
  let rainNodes = null;
  let oceanNodes = null;

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    return audioCtx;
  }

  function createNoiseBuffer(ctx, duration = 3) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function startRain(volume = 0.5) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (globalThis.window?.PIP?.audio?.isMuted && globalThis.window.PIP.audio.isMuted()) return;
    stopRain();

    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 4);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(clamp(volume) * 0.15, ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start();
    rainNodes = { src, filter, gain };
  }

  function stopRain() {
    if (rainNodes) {
      try {
        rainNodes.src.stop();
        rainNodes.src.disconnect();
      } catch {}
      rainNodes = null;
    }
  }

  function startOcean(volume = 0.5) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (globalThis.window?.PIP?.audio?.isMuted && globalThis.window.PIP.audio.isMuted()) return;
    stopOcean();

    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 6);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    // LFO for surf waves
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(clamp(volume) * 0.2, ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start();
    lfo.start();
    oceanNodes = { src, lfo, filter, gain };
  }

  function stopOcean() {
    if (oceanNodes) {
      try {
        oceanNodes.src.stop();
        oceanNodes.lfo.stop();
        oceanNodes.src.disconnect();
      } catch {}
      oceanNodes = null;
    }
  }

  function triggerThunder(volume = 0.5) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (globalThis.window?.PIP?.audio?.isMuted && globalThis.window.PIP.audio.isMuted()) return;

    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const vol = clamp(volume) * 0.4;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(now);
    src.stop(now + 3);
  }

  function initAmbience() {
    const rainBtn = document.getElementById('ambRainToggle');
    const oceanBtn = document.getElementById('ambOceanToggle');
    const thunderBtn = document.getElementById('ambThunderBtn');
    const rainVol = document.getElementById('ambRainVol');
    const oceanVol = document.getElementById('ambOceanVol');

    if (!rainBtn && !oceanBtn) return;

    const state = createAmbienceState();

    if (rainBtn) {
      rainBtn.addEventListener('click', () => {
        state.isRainPlaying = !state.isRainPlaying;
        if (state.isRainPlaying) {
          startRain(state.rainVolume);
          rainBtn.classList.add('is-active');
          rainBtn.setAttribute('aria-pressed', 'true');
        } else {
          stopRain();
          rainBtn.classList.remove('is-active');
          rainBtn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    if (rainVol) {
      rainVol.addEventListener('input', (e) => {
        state.rainVolume = clamp(e.target.value / 100);
        if (state.isRainPlaying && rainNodes) {
          rainNodes.gain.gain.setValueAtTime(state.rainVolume * 0.15, audioCtx.currentTime);
        }
      });
    }

    if (oceanBtn) {
      oceanBtn.addEventListener('click', () => {
        state.isOceanPlaying = !state.isOceanPlaying;
        if (state.isOceanPlaying) {
          startOcean(state.oceanVolume);
          oceanBtn.classList.add('is-active');
          oceanBtn.setAttribute('aria-pressed', 'true');
        } else {
          stopOcean();
          oceanBtn.classList.remove('is-active');
          oceanBtn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    if (oceanVol) {
      oceanVol.addEventListener('input', (e) => {
        state.oceanVolume = clamp(e.target.value / 100);
        if (state.isOceanPlaying && oceanNodes) {
          oceanNodes.gain.gain.setValueAtTime(state.oceanVolume * 0.2, audioCtx.currentTime);
        }
      });
    }

    if (thunderBtn) {
      thunderBtn.addEventListener('click', () => {
        triggerThunder(state.thunderVolume);
      });
    }

    // Stop all on mute
    window.addEventListener('pip-mute-change', () => {
      stopRain();
      stopOcean();
      state.isRainPlaying = false;
      state.isOceanPlaying = false;
      if (rainBtn) {
        rainBtn.classList.remove('is-active');
        rainBtn.setAttribute('aria-pressed', 'false');
      }
      if (oceanBtn) {
        oceanBtn.classList.remove('is-active');
        oceanBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAmbience);
    } else {
      initAmbience();
    }
  }

  return {
    clamp,
    createAmbienceState,
    startRain,
    stopRain,
    startOcean,
    stopOcean,
    triggerThunder,
    initAmbience
  };
});
