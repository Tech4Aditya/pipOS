/**
 * PipOS Simon-Says Music Sequence Memory Puzzle (pip-simon.exe)
 * 4-tone interactive memory puzzle using Web Audio synthesizer.
 * Zero external dependencies. IEEE IGDTUW Open Source Week 10.0.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PipSimon = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'pip_simon_highscore';
  const TONES = [
    { id: 0, color: 'green', freq: 261.63 },  // C4
    { id: 1, color: 'red', freq: 329.63 },    // E4
    { id: 2, color: 'yellow', freq: 392.00 }, // G4
    { id: 3, color: 'blue', freq: 523.25 }    // C5
  ];

  function createInitialState() {
    return {
      sequence: [],
      userStep: 0,
      round: 0,
      isPlayingSequence: false,
      gameOver: false
    };
  }

  function addStep(state) {
    const nextTone = Math.floor(Math.random() * 4);
    state.sequence.push(nextTone);
    state.round = state.sequence.length;
    state.userStep = 0;
    return state;
  }

  function checkInput(state, toneId) {
    if (!state || state.gameOver || state.isPlayingSequence) {
      return { success: false, finishedRound: false, gameOver: state?.gameOver || false };
    }

    if (state.sequence[state.userStep] === toneId) {
      state.userStep++;
      const finishedRound = state.userStep === state.sequence.length;
      return { success: true, finishedRound, gameOver: false };
    } else {
      state.gameOver = true;
      return { success: false, finishedRound: false, gameOver: true };
    }
  }

  function getHighScore(storage = globalThis.localStorage) {
    if (!storage) return 0;
    try {
      return parseInt(storage.getItem(STORAGE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(score, storage = globalThis.localStorage) {
    if (!storage) return false;
    try {
      const current = getHighScore(storage);
      if (score > current) {
        storage.setItem(STORAGE_KEY, String(score));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  let audioCtx = null;
  function playTone(freq, duration = 0.3) {
    try {
      if (globalThis.window?.PIP?.audio?.isMuted && globalThis.window.PIP.audio.isMuted()) {
        return;
      }
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  }

  function initSimon() {
    const padEls = [
      document.getElementById('simonPad0'),
      document.getElementById('simonPad1'),
      document.getElementById('simonPad2'),
      document.getElementById('simonPad3')
    ];
    const roundEl = document.getElementById('simonRound');
    const highEl = document.getElementById('simonHigh');
    const startBtn = document.getElementById('simonStartBtn');
    const statusEl = document.getElementById('simonStatus');

    if (!padEls[0]) return;

    let state = createInitialState();

    if (highEl) {
      highEl.textContent = `Best: ${getHighScore()}`;
    }

    function flashPad(id, duration = 300) {
      const pad = padEls[id];
      if (!pad) return;
      pad.classList.add('is-active');
      playTone(TONES[id].freq, duration / 1000);
      setTimeout(() => {
        pad.classList.remove('is-active');
      }, duration);
    }

    async function playSequence() {
      state.isPlayingSequence = true;
      if (statusEl) statusEl.textContent = 'Listen carefully...';

      for (let i = 0; i < state.sequence.length; i++) {
        await new Promise(r => setTimeout(r, 250));
        flashPad(state.sequence[i], 350);
        await new Promise(r => setTimeout(r, 400));
      }

      state.isPlayingSequence = false;
      if (statusEl) statusEl.textContent = 'Your turn!';
    }

    function nextRound() {
      addStep(state);
      if (roundEl) roundEl.textContent = `Round: ${state.round}`;
      playSequence();
    }

    function handlePadClick(toneId) {
      if (state.isPlayingSequence || state.gameOver) return;

      flashPad(toneId, 250);
      const res = checkInput(state, toneId);

      if (res.gameOver) {
        if (statusEl) statusEl.textContent = 'Oh no! Game Over.';
        saveHighScore(state.round > 0 ? state.round - 1 : 0);
        if (highEl) highEl.textContent = `Best: ${getHighScore()}`;
        if (startBtn) startBtn.textContent = '▶ Play Again';
      } else if (res.finishedRound) {
        if (statusEl) statusEl.textContent = 'Correct! Next melody...';
        setTimeout(nextRound, 800);
      }
    }

    padEls.forEach((pad, idx) => {
      if (pad) {
        pad.addEventListener('click', () => handlePadClick(idx));
      }
    });

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        state = createInitialState();
        if (startBtn) startBtn.textContent = '🔄 Restart';
        nextRound();
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSimon);
    } else {
      initSimon();
    }
  }

  return {
    TONES,
    createInitialState,
    addStep,
    checkInput,
    getHighScore,
    saveHighScore,
    initSimon
  };
});
