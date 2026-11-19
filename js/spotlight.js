/* spotlight.js: Quick Spotlight Command Launcher & Fuzzy App Finder for PipOS.
   Enables universal keyboard search (Cmd/Ctrl+K or Alt+Space) across apps, files, and commands. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var DEFAULT_ITEMS = [
    { id: 'calc', title: 'Starlight Calculator', desc: 'Musical arithmetic and sheep counter', icon: '🔢', type: 'app', target: '#calc' },
    { id: 'terminal', title: 'Midnight Terminal', desc: 'POSIX command-line shell', icon: '💻', type: 'app', target: '#terminal' },
    { id: 'notes', title: 'Markdown Notes Editor', desc: 'Bedtime story notes and live preview', icon: '📝', type: 'app', target: '#notes' },
    { id: 'monitor', title: 'Resource Monitor', desc: 'Memory sparklines and frame cadence', icon: '📊', type: 'app', target: '#monitor' },
    { id: 'w-synth', title: 'Starlight Synthesizer', desc: '8-step pentatonic lullaby sequencer', icon: '🎹', type: 'app', target: '#w-synth' },
    { id: 'w-sky', title: 'Constellation Cartographer', desc: 'Dream telescope star-connecting game', icon: '🔭', type: 'app', target: '#w-sky' },
    { id: 'stars', title: 'Catch the Falling Stars', desc: 'Retro star catching mini-game', icon: '✨', type: 'app', target: '#stars' },
    { id: 'blocks', title: 'Bedtime Blocks', desc: 'Tower building and leaderboard', icon: '🧱', type: 'app', target: '#blocks' },
    { id: 'lab', title: 'Lullaby Lab', desc: 'Wound-up music box instrument', icon: '♪', type: 'app', target: '#lab' },
    { id: 'lights', title: 'Midnight Lights', desc: 'Multi-room darkroom exploration', icon: '🔦', type: 'app', target: '#lights' },
    { id: 'storybook', title: 'Bedtime Storybook', desc: 'Interactive flipbook narrative', icon: '📖', type: 'app', target: '#storyTrack' },
    { id: 'stickers', title: 'Sticker Album', desc: 'Milestone achievements and badges', icon: '⭐', type: 'app', target: '#stickers' },
    { id: 'wall', title: 'Wish Wall', desc: 'Community bedtime wishes', icon: '📌', type: 'app', target: '#wall' },
    { id: 'theme', title: 'Toggle Day / Night Mode', desc: 'Switch celestial lighting', icon: '🌓', type: 'system', action: 'theme' },
    { id: 'sound', title: 'Toggle Sound Effects', desc: 'Mute or unmute synthesized audio', icon: '🎵', type: 'system', action: 'sound' },
    { id: 'fullscreen', title: 'Toggle Fullscreen', desc: 'Immersive desktop mode', icon: '⛶', type: 'system', action: 'fullscreen' }
  ];

  function scoreMatch(query, target) {
    if (!query) return 1;
    if (!target) return 0;

    var q = query.trim().toLowerCase();
    var t = target.toLowerCase();

    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;

    var words = t.split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].indexOf(q) === 0) return 70;
    }

    var subIdx = t.indexOf(q);
    if (subIdx !== -1) return 50 - subIdx;

    // Subsequence fuzzy match
    var qIdx = 0;
    var consecutive = 0;
    var score = 10;
    for (var j = 0; j < t.length && qIdx < q.length; j++) {
      if (t[j] === q[qIdx]) {
        score += 2 + consecutive * 2;
        consecutive++;
        qIdx++;
      } else {
        consecutive = 0;
      }
    }

    return (qIdx === q.length) ? score : 0;
  }

  function search(query, catalog) {
    var items = catalog || DEFAULT_ITEMS;
    if (!query || !query.trim()) {
      return items.slice(0, 8);
    }

    var q = query.trim();
    var scored = [];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var titleScore = scoreMatch(q, it.title);
      var descScore = scoreMatch(q, it.desc);
      var maxScore = Math.max(titleScore * 1.5, descScore);

      if (maxScore > 0) {
        scored.push({
          item: it,
          score: maxScore
        });
      }
    }

    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    var results = [];
    for (var k = 0; k < scored.length; k++) {
      results.push(scored[k].item);
    }
    return results;
  }

  var activeIndex = 0;
  var visibleResults = [];
  var lastFocusedEl = null;

  function showSpotlight() {
    if (typeof document === 'undefined') return;
    var modal = document.getElementById('spotlightModal');
    var input = document.getElementById('spotlightInput');
    if (!modal || !input) return;

    lastFocusedEl = document.activeElement;
    modal.removeAttribute('hidden');
    input.value = '';
    activeIndex = 0;
    renderResults('');
    input.focus();
  }

  function hideSpotlight() {
    if (typeof document === 'undefined') return;
    var modal = document.getElementById('spotlightModal');
    if (!modal) return;
    modal.setAttribute('hidden', '');

    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      try {
        lastFocusedEl.focus();
      } catch (e) {}
    }
  }

  function executeItem(item) {
    if (!item) return;
    hideSpotlight();

    if (typeof item.action === 'function') {
      item.action();
      return;
    }

    if (item.action === 'theme') {
      var themeBtn = document.getElementById('themeBtn');
      if (themeBtn) themeBtn.click();
    } else if (item.action === 'sound') {
      if (PIP.audio && typeof PIP.audio.toggle === 'function') {
        PIP.audio.toggle();
      }
    } else if (item.action === 'fullscreen') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen().catch(function () {});
      }
    } else if (item.target) {
      var el = document.querySelector(item.target);
      if (el) {
        el.removeAttribute('hidden');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (PIP.windowManager && typeof PIP.windowManager.bringToFront === 'function') {
          PIP.windowManager.bringToFront(el);
        }
      }
    }
  }

  function renderResults(query) {
    if (typeof document === 'undefined') return;
    var list = document.getElementById('spotlightList');
    if (!list) return;

    visibleResults = search(query);
    if (activeIndex >= visibleResults.length) {
      activeIndex = Math.max(0, visibleResults.length - 1);
    }

    list.innerHTML = '';
    if (visibleResults.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'spotlight-empty';
      empty.textContent = 'No matching dreams or programs found.';
      list.appendChild(empty);
      return;
    }

    visibleResults.forEach(function (it, idx) {
      var row = document.createElement('div');
      row.className = 'spotlight-item' + (idx === activeIndex ? ' is-active' : '');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
      row.setAttribute('data-index', String(idx));

      var ic = document.createElement('span');
      ic.className = 'spotlight-item-icon';
      ic.setAttribute('aria-hidden', 'true');
      ic.textContent = it.icon || '🚀';

      var textWrap = document.createElement('div');
      textWrap.className = 'spotlight-item-text';

      var title = document.createElement('strong');
      title.className = 'spotlight-item-title';
      title.textContent = it.title;

      var desc = document.createElement('span');
      desc.className = 'spotlight-item-desc';
      desc.textContent = it.desc;

      textWrap.appendChild(title);
      textWrap.appendChild(desc);

      var badge = document.createElement('span');
      badge.className = 'spotlight-badge';
      badge.textContent = it.type ? it.type.toUpperCase() : 'APP';

      row.appendChild(ic);
      row.appendChild(textWrap);
      row.appendChild(badge);

      row.addEventListener('click', function () {
        executeItem(it);
      });

      list.appendChild(row);
    });
  }

  function init() {
    if (typeof document === 'undefined') return;

    var input = document.getElementById('spotlightInput');
    if (input) {
      input.addEventListener('input', function (e) {
        activeIndex = 0;
        renderResults(e.target.value);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (visibleResults.length > 0) {
            activeIndex = (activeIndex + 1) % visibleResults.length;
            renderResults(input.value);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (visibleResults.length > 0) {
            activeIndex = (activeIndex - 1 + visibleResults.length) % visibleResults.length;
            renderResults(input.value);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (visibleResults[activeIndex]) {
            executeItem(visibleResults[activeIndex]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          hideSpotlight();
        }
      });
    }

    // Global keyboard shortcuts (Cmd/Ctrl + K or Alt + Space)
    document.addEventListener('keydown', function (e) {
      var isK = (e.key === 'k' || e.key === 'K');
      var isCtrlK = (e.metaKey || e.ctrlKey) && isK;
      var isAltSpace = e.altKey && (e.code === 'Space' || e.key === ' ');

      if (isCtrlK || isAltSpace) {
        e.preventDefault();
        var modal = document.getElementById('spotlightModal');
        if (modal && modal.hasAttribute('hidden')) {
          showSpotlight();
        } else {
          hideSpotlight();
        }
      }
    });

    // Dismiss on overlay backdrop click
    var modal = document.getElementById('spotlightModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          hideSpotlight();
        }
      });
    }
  }

  var PipSpotlight = {
    init: init,
    search: search,
    scoreMatch: scoreMatch,
    showSpotlight: showSpotlight,
    hideSpotlight: hideSpotlight,
    DEFAULT_ITEMS: DEFAULT_ITEMS
  };

  PIP.spotlight = PipSpotlight;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipSpotlight;
  }
})();
