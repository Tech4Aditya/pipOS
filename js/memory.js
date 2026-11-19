/**
 * js/memory.js
 * Celestial Memory Match 4x4 Mini-Game (pip-memory.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.memory = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SYMBOLS = [
    { icon: '🌙', name: 'Crescent Moon', pitch: 261.63 }, // C4
    { icon: '⭐', name: 'Twinkle Star', pitch: 293.66 },   // D4
    { icon: '🪐', name: 'Ringed Planet', pitch: 329.63 },  // E4
    { icon: '☄️', name: 'Shooting Comet', pitch: 392.00 }, // G4
    { icon: '🚀', name: 'Pip Rocket', pitch: 440.00 },    // A4
    { icon: '☁️', name: 'Dream Cloud', pitch: 523.25 },   // C5
    { icon: '🦉', name: 'Night Owl', pitch: 587.33 },     // D5
    { icon: '🌸', name: 'Moonflower', pitch: 659.25 }     // E5
  ];

  var BEST_MOVES_KEY = 'pipos_memory_best_moves';
  var BEST_TIME_KEY = 'pipos_memory_best_time';

  var state = {
    cards: [],
    flippedIndices: [],
    moves: 0,
    matches: 0,
    startTime: null,
    elapsedSeconds: 0,
    timerInterval: null,
    isLocked: false,
    isWon: false,
    bestMoves: null,
    bestTime: null
  };

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  function loadBestRecords() {
    var store = getStorage();
    if (!store) return;
    try {
      var m = store.getItem(BEST_MOVES_KEY);
      var t = store.getItem(BEST_TIME_KEY);
      if (m !== null) state.bestMoves = parseInt(m, 10);
      if (t !== null) state.bestTime = parseInt(t, 10);
    } catch (_) {}
  }

  function saveBestRecords() {
    var store = getStorage();
    if (!store) return;
    try {
      if (state.bestMoves !== null) store.setItem(BEST_MOVES_KEY, String(state.bestMoves));
      if (state.bestTime !== null) store.setItem(BEST_TIME_KEY, String(state.bestTime));
    } catch (_) {}
  }

  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function playTone(freq, duration) {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.2));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (duration || 0.2));
      }
    } catch (_) {}
  }

  function initGame() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    loadBestRecords();

    // Prepare 8 pairs (16 cards total)
    var deck = [];
    SYMBOLS.forEach(function (sym, symIdx) {
      deck.push({ symIdx: symIdx, icon: sym.icon, name: sym.name, pitch: sym.pitch });
      deck.push({ symIdx: symIdx, icon: sym.icon, name: sym.name, pitch: sym.pitch });
    });

    var shuffled = shuffle(deck);

    state.cards = shuffled.map(function (c, idx) {
      return {
        id: idx,
        symIdx: c.symIdx,
        icon: c.icon,
        name: c.name,
        pitch: c.pitch,
        isFlipped: false,
        isMatched: false
      };
    });

    state.flippedIndices = [];
    state.moves = 0;
    state.matches = 0;
    state.startTime = null;
    state.elapsedSeconds = 0;
    state.isLocked = false;
    state.isWon = false;

    return state;
  }

  function startTimerIfNeeded() {
    if (state.startTime === null) {
      state.startTime = Date.now();
      if (typeof setInterval !== 'undefined') {
        state.timerInterval = setInterval(function () {
          if (!state.isWon && state.startTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
            updateTimerDisplay();
          }
        }, 1000);
      }
    }
  }

  function updateTimerDisplay() {
    var timerEl = document.getElementById('memoryTimer');
    if (timerEl) {
      var m = Math.floor(state.elapsedSeconds / 60);
      var s = state.elapsedSeconds % 60;
      timerEl.textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }
  }

  function flipCard(idx, onComplete) {
    if (state.isLocked) return false;
    if (idx < 0 || idx >= state.cards.length) return false;

    var card = state.cards[idx];
    if (card.isFlipped || card.isMatched) return false;

    startTimerIfNeeded();

    card.isFlipped = true;
    state.flippedIndices.push(idx);
    playTone(card.pitch, 0.2);

    if (state.flippedIndices.length === 2) {
      state.moves++;
      var firstIdx = state.flippedIndices[0];
      var secondIdx = state.flippedIndices[1];
      var firstCard = state.cards[firstIdx];
      var secondCard = state.cards[secondIdx];

      if (firstCard.symIdx === secondCard.symIdx) {
        // MATCH!
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        state.matches++;
        state.flippedIndices = [];
        playTone(card.pitch * 1.5, 0.35); // Harmony chime

        if (state.matches === SYMBOLS.length) {
          // WON!
          state.isWon = true;
          if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
          }

          if (state.bestMoves === null || state.moves < state.bestMoves) {
            state.bestMoves = state.moves;
          }
          if (state.bestTime === null || state.elapsedSeconds < state.bestTime) {
            state.bestTime = state.elapsedSeconds;
          }
          saveBestRecords();

          if (typeof PIP !== 'undefined' && PIP.toast) {
            PIP.toast('🌟 Celestial Memory Cleared in ' + state.moves + ' moves!');
          }
        }

        if (typeof onComplete === 'function') onComplete();
        return true;
      } else {
        // MISMATCH!
        state.isLocked = true;
        playTone(180, 0.15); // soft lower buzz
        setTimeout(function () {
          firstCard.isFlipped = false;
          secondCard.isFlipped = false;
          state.flippedIndices = [];
          state.isLocked = false;
          if (typeof onComplete === 'function') onComplete();
        }, 700);
        return true;
      }
    }

    if (typeof onComplete === 'function') onComplete();
    return true;
  }

  function render(gridContainer) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    state.cards.forEach(function (c, idx) {
      var row = Math.floor(idx / 4) + 1;
      var col = (idx % 4) + 1;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'memory-card' + (c.isFlipped ? ' is-flipped' : '') + (c.isMatched ? ' is-matched' : '');
      btn.setAttribute('data-index', String(idx));

      var label = 'Card row ' + row + ' column ' + col + ': ';
      if (c.isMatched) {
        label += c.name + ', matched';
      } else if (c.isFlipped) {
        label += c.name + ', face up';
      } else {
        label += 'face down';
      }
      btn.setAttribute('aria-label', label);

      var cardInner = document.createElement('div');
      cardInner.className = 'memory-card-inner';

      var cardFront = document.createElement('div');
      cardFront.className = 'memory-card-front';
      cardFront.setAttribute('aria-hidden', 'true');
      cardFront.textContent = '✨';

      var cardBack = document.createElement('div');
      cardBack.className = 'memory-card-back';
      cardBack.setAttribute('aria-hidden', 'true');
      cardBack.textContent = c.icon;

      cardInner.appendChild(cardFront);
      cardInner.appendChild(cardBack);
      btn.appendChild(cardInner);

      btn.addEventListener('click', function () {
        flipCard(idx, function () {
          render(gridContainer);
          updateStatus();
        });
        render(gridContainer);
        updateStatus();
      });

      gridContainer.appendChild(btn);
    });
  }

  function updateStatus() {
    var movesEl = document.getElementById('memoryMoves');
    if (movesEl) movesEl.textContent = String(state.moves);

    var matchesEl = document.getElementById('memoryMatches');
    if (matchesEl) matchesEl.textContent = state.matches + ' / ' + SYMBOLS.length;

    var bestEl = document.getElementById('memoryBest');
    if (bestEl) {
      if (state.bestMoves !== null) {
        bestEl.textContent = state.bestMoves + ' moves (' + state.bestTime + 's)';
      } else {
        bestEl.textContent = 'None';
      }
    }
  }

  function init() {
    initGame();

    var grid = document.getElementById('memoryGrid');
    var restartBtn = document.getElementById('memoryRestartBtn');

    if (grid) render(grid);
    updateStatus();

    if (restartBtn && grid) {
      restartBtn.addEventListener('click', function () {
        initGame();
        render(grid);
        updateStatus();
        updateTimerDisplay();
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    SYMBOLS: SYMBOLS,
    initGame: initGame,
    flipCard: flipCard,
    getState: function () {
      return {
        cards: state.cards.map(function (c) { return Object.assign({}, c); }),
        moves: state.moves,
        matches: state.matches,
        isWon: state.isWon,
        isLocked: state.isLocked,
        bestMoves: state.bestMoves,
        bestTime: state.bestTime
      };
    },
    render: render,
    init: init
  };
});
