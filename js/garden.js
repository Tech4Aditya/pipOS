/**
 * js/garden.js
 * Midnight Garden Virtual Pet & Plant Care (pip-garden.exe)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.garden = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'pipos_garden_state';

  var SPECIES = {
    moonflower: { id: 'moonflower', name: 'Celestial Moonflower', emoji: '🌸', desc: 'Blooms under full moonlight with glowing nocturnal petals.' },
    fern: { id: 'fern', name: 'Starlight Fern', emoji: '🌿', desc: 'Ancient nursery fern that curls its fronds when sung to.' },
    shroom: { id: 'shroom', name: 'Lullaby Shroom', emoji: '🍄', desc: 'Emits a soft musical glow during bedtime hours.' },
    berry: { id: 'berry', name: 'Dream Berry', emoji: '🫐', desc: 'Sweet night berries that inspire peaceful dreams.' },
    cactus: { id: 'cactus', name: 'Celestial Cactus', emoji: '🌵', desc: 'Grows tiny star thorns that sparkle like constellations.' }
  };

  var STAGE_NAMES = ['Seed 🌱', 'Sprout 🌿', 'Budding 🌷', 'Blooming 🌸', 'Radiant Bloom ✨'];

  var state = {
    activeSpecies: 'moonflower',
    stage: 0,
    growthPoints: 0,
    waterLevel: 50,
    lightLevel: 50,
    loveLevel: 50,
    totalBlooms: 0,
    lastCareTime: Date.now()
  };

  function getStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  function load() {
    var store = getStorage();
    if (!store) return;
    try {
      var raw = store.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state.activeSpecies = SPECIES[parsed.activeSpecies] ? parsed.activeSpecies : 'moonflower';
          state.stage = Math.max(0, Math.min(4, parseInt(parsed.stage, 10) || 0));
          state.growthPoints = Math.max(0, Math.min(100, parseInt(parsed.growthPoints, 10) || 0));
          state.waterLevel = Math.max(0, Math.min(100, parseInt(parsed.waterLevel, 10) || 0));
          state.lightLevel = Math.max(0, Math.min(100, parseInt(parsed.lightLevel, 10) || 0));
          state.loveLevel = Math.max(0, Math.min(100, parseInt(parsed.loveLevel, 10) || 0));
          state.totalBlooms = parseInt(parsed.totalBlooms, 10) || 0;
          state.lastCareTime = parsed.lastCareTime || Date.now();
        }
      }
    } catch (_) {}
  }

  function save() {
    var store = getStorage();
    if (!store) return;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function playGardenChime(freq) {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq || 523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}
  }

  function checkEvolution() {
    if (state.growthPoints >= 100 && state.stage < 4) {
      state.stage++;
      state.growthPoints = 0;
      playGardenChime(659.25); // E5 evolution chime
      if (typeof PIP !== 'undefined' && PIP.toast) {
        PIP.toast('✨ Your ' + SPECIES[state.activeSpecies].name + ' grew into ' + STAGE_NAMES[state.stage] + '!');
      }
    }
  }

  function water() {
    state.waterLevel = Math.min(100, state.waterLevel + 35);
    state.growthPoints = Math.min(100, state.growthPoints + 15);
    state.lastCareTime = Date.now();
    playGardenChime(392.00); // G4
    checkEvolution();
    save();
    return getState();
  }

  function shine() {
    state.lightLevel = Math.min(100, state.lightLevel + 35);
    state.growthPoints = Math.min(100, state.growthPoints + 15);
    state.lastCareTime = Date.now();
    playGardenChime(440.00); // A4
    checkEvolution();
    save();
    return getState();
  }

  function sing() {
    state.loveLevel = Math.min(100, state.loveLevel + 35);
    state.growthPoints = Math.min(100, state.growthPoints + 20);
    state.lastCareTime = Date.now();
    playGardenChime(523.25); // C5
    checkEvolution();
    save();
    return getState();
  }

  function harvest() {
    if (state.stage < 3) return false;
    state.totalBlooms++;
    state.stage = 0;
    state.growthPoints = 0;
    state.waterLevel = 50;
    state.lightLevel = 50;
    state.loveLevel = 50;
    playGardenChime(783.99); // G5 celebration chime
    if (typeof PIP !== 'undefined' && PIP.toast) {
      PIP.toast('🌸 Harvested Starlight Essence! Total blooms: ' + state.totalBlooms);
    }
    save();
    return true;
  }

  function switchPlant(speciesId) {
    if (!SPECIES[speciesId]) return false;
    state.activeSpecies = speciesId;
    state.stage = 0;
    state.growthPoints = 0;
    state.waterLevel = 60;
    state.lightLevel = 60;
    state.loveLevel = 60;
    save();
    return true;
  }

  function getState() {
    var species = SPECIES[state.activeSpecies] || SPECIES.moonflower;
    return {
      activeSpecies: state.activeSpecies,
      speciesName: species.name,
      speciesEmoji: species.emoji,
      speciesDesc: species.desc,
      stage: state.stage,
      stageName: STAGE_NAMES[state.stage],
      growthPoints: state.growthPoints,
      waterLevel: state.waterLevel,
      lightLevel: state.lightLevel,
      loveLevel: state.loveLevel,
      totalBlooms: state.totalBlooms
    };
  }

  function updateUI() {
    var snap = getState();

    var iconEl = document.getElementById('gardenPlantIcon');
    if (iconEl) {
      if (snap.stage === 0) iconEl.textContent = '🌱';
      else if (snap.stage === 1) iconEl.textContent = '🌿';
      else if (snap.stage === 2) iconEl.textContent = '🌷';
      else if (snap.stage === 3) iconEl.textContent = snap.speciesEmoji;
      else iconEl.textContent = '✨' + snap.speciesEmoji + '✨';
    }

    var stageEl = document.getElementById('gardenPlantStage');
    if (stageEl) stageEl.textContent = snap.stageName;

    var descEl = document.getElementById('gardenPlantDesc');
    if (descEl) descEl.textContent = snap.speciesDesc;

    var wBar = document.getElementById('gardenWaterBar');
    if (wBar) wBar.style.width = snap.waterLevel + '%';

    var lBar = document.getElementById('gardenLightBar');
    if (lBar) lBar.style.width = snap.lightLevel + '%';

    var loveBar = document.getElementById('gardenLoveBar');
    if (loveBar) loveBar.style.width = snap.loveLevel + '%';

    var gBar = document.getElementById('gardenGrowthBar');
    if (gBar) gBar.style.width = snap.growthPoints + '%';

    var bloomsEl = document.getElementById('gardenBloomsCount');
    if (bloomsEl) bloomsEl.textContent = String(snap.totalBlooms);

    var harvestBtn = document.getElementById('gardenHarvestBtn');
    if (harvestBtn) {
      harvestBtn.disabled = snap.stage < 3;
    }
  }

  function init() {
    load();

    var selectEl = document.getElementById('gardenPlantSelect');
    var waterBtn = document.getElementById('gardenWaterBtn');
    var shineBtn = document.getElementById('gardenShineBtn');
    var singBtn = document.getElementById('gardenSingBtn');
    var harvestBtn = document.getElementById('gardenHarvestBtn');

    if (selectEl) {
      selectEl.value = state.activeSpecies;
      selectEl.addEventListener('change', function () {
        switchPlant(selectEl.value);
        updateUI();
      });
    }

    if (waterBtn) {
      waterBtn.addEventListener('click', function () {
        water();
        updateUI();
      });
    }

    if (shineBtn) {
      shineBtn.addEventListener('click', function () {
        shine();
        updateUI();
      });
    }

    if (singBtn) {
      singBtn.addEventListener('click', function () {
        sing();
        updateUI();
      });
    }

    if (harvestBtn) {
      harvestBtn.addEventListener('click', function () {
        harvest();
        updateUI();
      });
    }

    updateUI();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    SPECIES: SPECIES,
    STAGE_NAMES: STAGE_NAMES,
    water: water,
    shine: shine,
    sing: sing,
    harvest: harvest,
    switchPlant: switchPlant,
    getState: getState,
    load: load,
    save: save,
    init: init
  };
});
