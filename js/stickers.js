/* stickers.js: persistent achievements and sticker album.
   Tracks 5 achievements in localStorage (via PIP.store):
   1. dreams5: Found all 5 dreams in the darkroom
   2. blocks10: Stacked 10 blocks in Rattle & Blocks
   3. route7: Delivered all 7 dreams in Dream Delivery
   4. star: Woke Pip with the gold star on the nightcap
   5. wish: Left a wish on the wish wall
*/
(function () {
  'use strict';

  var memStore = {};
  var PIP = (typeof window !== 'undefined' && window.PIP) ? window.PIP : {};
  var $ = PIP.$ || function (sel, root) {
    if (typeof document === 'undefined') return null;
    return (root || document).querySelector(sel);
  };
  var $$ = PIP.$$ || function (sel, root) {
    if (typeof document === 'undefined') return [];
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var store = (PIP && PIP.store) ? PIP.store : {
    get: function (k, d) { return (k in memStore) ? memStore[k] : d; },
    set: function (k, v) { memStore[k] = String(v); }
  };
  var toast = PIP.toast || function () {};
  var audio = PIP.audio || { isOn: function () { return false; } };

  var STICKERS = [
    {
      id: 'dreams5',
      name: 'Nightlight Keeper',
      desc: 'Found all 5 dreams hiding in the dark nursery.',
      hint: 'Find all 5 hidden dreams in the Nightlight Collection.',
      icon: 'lantern'
    },
    {
      id: 'blocks10',
      name: 'Tower Stacker',
      desc: 'Stacked a wobbly tower 10 blocks high.',
      hint: 'Stack 10 blocks high in Rattle & Blocks.',
      icon: 'blocks'
    },
    {
      id: 'route7',
      name: 'Cloud Courier',
      desc: 'Delivered all 7 dreams on the rooftop route.',
      hint: 'Deliver dreams to all 7 houses in Dream Delivery.',
      icon: 'route'
    },
    {
      id: 'star',
      name: 'Star Detective',
      desc: 'Woke Pip by finding the gold star.',
      hint: 'Tap the secret gold star on Pip\'s nightcap 5 times.',
      icon: 'star'
    },
    {
      id: 'wish',
      name: 'Midnight Wisher',
      desc: 'Left a bedtime wish on the wish wall.',
      hint: 'Pin a wish to the wall for Pip.',
      icon: 'wish'
    }
  ];

  function getUnlocked() {
    try {
      var raw = store.get('stickers', null);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveUnlocked(map) {
    try {
      store.set('stickers', JSON.stringify(map));
    } catch (e) {}
  }

  function isUnlocked(id) {
    var unlocked = getUnlocked();
    return !!unlocked[id];
  }

  function unlock(id, silent) {
    var sticker = null;
    for (var i = 0; i < STICKERS.length; i++) {
      if (STICKERS[i].id === id) { sticker = STICKERS[i]; break; }
    }
    if (!sticker) return false;

    var unlocked = getUnlocked();
    if (unlocked[id]) return false; // already unlocked

    unlocked[id] = Date.now();
    saveUnlocked(unlocked);

    if (!silent) {
      toast('✦ Sticker unlocked: ' + sticker.name + '!');
      if (audio && typeof audio.isOn === 'function' && audio.isOn()) {
        if (typeof audio.note === 'function' && audio.SCALE) {
          audio.note(audio.SCALE[4], { dur: 0.9, gain: 0.16 });
          audio.note(audio.SCALE[7], { dur: 1.2, gain: 0.14, when: 0.14 });
        }
      }
      if (PIP.fx && typeof PIP.fx.confetti === 'function') {
        PIP.fx.confetti(40);
      }
    }

    render();
    return true;
  }

  function reset() {
    saveUnlocked({});
    toast('Stickers reset. All achievements locked again.');
    if (audio && typeof audio.isOn === 'function' && audio.isOn() && typeof audio.pop === 'function') {
      audio.pop();
    }
    render();
  }

  function countUnlocked() {
    var unlocked = getUnlocked();
    var count = 0;
    STICKERS.forEach(function (s) {
      if (unlocked[s.id]) count++;
    });
    return count;
  }

  function render() {
    if (typeof document === 'undefined') return;
    var unlocked = getUnlocked();
    var count = countUnlocked();

    var countEl = $('#stickerCount');
    if (countEl) {
      countEl.textContent = count + ' of ' + STICKERS.length + ' stickers collected';
    }

    STICKERS.forEach(function (s) {
      var card = $('[data-sticker="' + s.id + '"]');
      if (!card) return;
      var isGot = !!unlocked[s.id];

      card.classList.toggle('is-unlocked', isGot);
      card.classList.toggle('is-locked', !isGot);

      var statusText = isGot ? 'Unlocked' : 'Locked';
      var textAlt = s.name + ' sticker: ' + statusText + '. ' + s.desc;
      card.setAttribute('aria-label', textAlt);

      var statusEl = $('.st-status', card);
      if (statusEl) {
        statusEl.textContent = isGot ? 'Unlocked ✦' : 'Locked';
        statusEl.classList.toggle('is-unlocked', isGot);
        statusEl.classList.toggle('is-locked', !isGot);
      }
    });
  }

  function init() {
    var resetBtn = $('#resetStickersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        reset();
      });
    }

    // Auto-detect previously completed achievements if stickers key is entirely uninitialized
    var raw = store.get('stickers', null);
    if (raw === null) {
      try {
        var totalFound = parseInt(store.get('dr_total_found', '0'), 10) || parseInt(store.get('nightlight_found', '0'), 10) || 0;
        if (totalFound >= 5) unlock('dreams5', true);

        var best = parseInt(store.get('best', '0'), 10) || 0;
        if (best >= 10) unlock('blocks10', true);

        var wishes = JSON.parse(store.get('wall', '[]'));
        if (Array.isArray(wishes) && wishes.length > 0) unlock('wish', true);
      } catch (e) {}
    }

    render();
  }

  var stickersModule = {
    STICKERS: STICKERS,
    getUnlocked: getUnlocked,
    isUnlocked: isUnlocked,
    unlock: unlock,
    reset: reset,
    countUnlocked: countUnlocked,
    render: render,
    init: init
  };

  PIP.stickers = stickersModule;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stickersModule;
  }
})();
