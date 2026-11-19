/**
 * js/users.js
 * Multi-User Profile Switcher & Screen Lock Sandbox (pip-users)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.users = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var USERS_KEY = 'pipos_users_list';
  var ACTIVE_KEY = 'pipos_active_user_id';
  var LOCK_KEY = 'pipos_is_locked';

  var AVATARS = ['🍼', '🚀', '🦉', '🌸', '🪐', '🧸', '⭐', '🌙'];

  var DEFAULT_PROFILES = [
    {
      id: 'user_default',
      name: 'Pip Little One',
      avatar: '🍼',
      theme: 'default',
      pin: '',
      createdAt: Date.now()
    },
    {
      id: 'user_astronomer',
      name: 'Starlight Dreamer',
      avatar: '🚀',
      theme: 'night',
      pin: '',
      createdAt: Date.now()
    }
  ];

  var state = {
    profiles: [],
    activeId: 'user_default',
    isLocked: false
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
    if (!store) {
      state.profiles = DEFAULT_PROFILES.slice();
      state.activeId = 'user_default';
      state.isLocked = false;
      return;
    }

    try {
      var raw = store.getItem(USERS_KEY);
      if (raw) {
        state.profiles = JSON.parse(raw);
      } else {
        state.profiles = DEFAULT_PROFILES.slice();
      }
    } catch (_) {
      state.profiles = DEFAULT_PROFILES.slice();
    }

    try {
      var active = store.getItem(ACTIVE_KEY);
      if (active && state.profiles.some(function (p) { return p.id === active; })) {
        state.activeId = active;
      } else {
        state.activeId = state.profiles[0] ? state.profiles[0].id : 'user_default';
      }
    } catch (_) {
      state.activeId = 'user_default';
    }

    try {
      state.isLocked = store.getItem(LOCK_KEY) === 'true';
    } catch (_) {
      state.isLocked = false;
    }
  }

  function save() {
    var store = getStorage();
    if (!store) return;
    try {
      store.setItem(USERS_KEY, JSON.stringify(state.profiles));
      store.setItem(ACTIVE_KEY, state.activeId);
      store.setItem(LOCK_KEY, state.isLocked ? 'true' : 'false');
    } catch (_) {}
  }

  function generateId() {
    return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function getProfiles() {
    return state.profiles.slice();
  }

  function getActiveProfile() {
    for (var i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].id === state.activeId) {
        return state.profiles[i];
      }
    }
    return state.profiles[0] || null;
  }

  function createProfile(name, avatar, theme, pin) {
    var newProfile = {
      id: generateId(),
      name: (name || 'New Starlight Guest').trim(),
      avatar: AVATARS.indexOf(avatar) !== -1 ? avatar : '⭐',
      theme: theme === 'night' ? 'night' : 'default',
      pin: pin ? String(pin).trim() : '',
      createdAt: Date.now()
    };
    state.profiles.push(newProfile);
    save();
    return newProfile;
  }

  function switchProfile(profileId) {
    var target = null;
    for (var i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].id === profileId) {
        target = state.profiles[i];
        break;
      }
    }
    if (!target) return false;

    state.activeId = target.id;
    save();

    // Apply profile theme if available
    if (typeof document !== 'undefined' && document.documentElement) {
      if (target.theme === 'night') {
        document.documentElement.setAttribute('data-theme', 'night');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }

    if (typeof PIP !== 'undefined' && PIP.toast) {
      PIP.toast('Switched profile to ' + target.avatar + ' ' + target.name);
    }

    return true;
  }

  function deleteProfile(profileId) {
    if (state.profiles.length <= 1) return false; // Prevent deleting last remaining profile
    var initialLen = state.profiles.length;
    state.profiles = state.profiles.filter(function (p) { return p.id !== profileId; });
    if (state.profiles.length < initialLen) {
      if (state.activeId === profileId) {
        state.activeId = state.profiles[0].id;
      }
      save();
      return true;
    }
    return false;
  }

  function lock() {
    state.isLocked = true;
    save();
    if (typeof document !== 'undefined') {
      var lockEl = document.getElementById('lockScreen');
      if (lockEl) {
        lockEl.classList.remove('is-hidden');
        lockEl.removeAttribute('inert');
      }
    }
    return true;
  }

  function unlock(pinInput) {
    var active = getActiveProfile();
    if (active && active.pin) {
      if (String(pinInput || '').trim() !== active.pin) {
        return false; // Wrong PIN
      }
    }

    state.isLocked = false;
    save();
    if (typeof document !== 'undefined') {
      var lockEl = document.getElementById('lockScreen');
      if (lockEl) {
        lockEl.classList.add('is-hidden');
        lockEl.setAttribute('inert', '');
      }
    }
    return true;
  }

  function isLocked() {
    return state.isLocked;
  }

  function render(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    var active = getActiveProfile();

    state.profiles.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'user-card' + (p.id === state.activeId ? ' is-active-user' : '');

      var avatar = document.createElement('span');
      avatar.className = 'user-card-avatar';
      avatar.textContent = p.avatar;

      var info = document.createElement('div');
      info.className = 'user-card-info';

      var name = document.createElement('div');
      name.className = 'user-card-name';
      name.textContent = p.name;

      var role = document.createElement('div');
      role.className = 'user-card-meta';
      role.textContent = (p.id === state.activeId ? 'Active Profile' : 'Guest') + ' • Theme: ' + p.theme;

      info.appendChild(name);
      info.appendChild(role);

      var actions = document.createElement('div');
      actions.className = 'user-card-actions';

      if (p.id !== state.activeId) {
        var switchBtn = document.createElement('button');
        switchBtn.type = 'button';
        switchBtn.className = 'btn btn-tiny btn-primary';
        switchBtn.textContent = 'Switch';
        switchBtn.addEventListener('click', function () {
          switchProfile(p.id);
          render(containerEl);
        });
        actions.appendChild(switchBtn);

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-tiny';
        delBtn.textContent = '🗑️';
        delBtn.title = 'Delete profile';
        delBtn.addEventListener('click', function () {
          deleteProfile(p.id);
          render(containerEl);
        });
        actions.appendChild(delBtn);
      } else {
        var badge = document.createElement('span');
        badge.className = 'user-active-badge';
        badge.textContent = '✓ Current';
        actions.appendChild(badge);
      }

      card.appendChild(avatar);
      card.appendChild(info);
      card.appendChild(actions);
      containerEl.appendChild(card);
    });
  }

  function init() {
    load();

    var listEl = document.getElementById('usersList');
    var addBtn = document.getElementById('usersCreateBtn');
    var lockBtn = document.getElementById('usersLockBtn');
    var nameInput = document.getElementById('usersNewName');
    var avatarSelect = document.getElementById('usersNewAvatar');
    var unlockBtn = document.getElementById('lockUnlockBtn');
    var pinInput = document.getElementById('lockPinInput');

    if (listEl) render(listEl);

    if (addBtn && nameInput && avatarSelect && listEl) {
      addBtn.addEventListener('click', function () {
        var n = nameInput.value.trim();
        if (n) {
          createProfile(n, avatarSelect.value, 'default', '');
          nameInput.value = '';
          render(listEl);
        }
      });
    }

    if (lockBtn) {
      lockBtn.addEventListener('click', function () {
        lock();
      });
    }

    if (unlockBtn) {
      unlockBtn.addEventListener('click', function () {
        var val = pinInput ? pinInput.value : '';
        var ok = unlock(val);
        if (!ok && pinInput) {
          pinInput.value = '';
          pinInput.placeholder = 'Wrong PIN!';
        }
      });
    }

    if (state.isLocked) {
      lock();
    }
  }

  // Populate state on load
  load();

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    AVATARS: AVATARS,
    getProfiles: getProfiles,
    getActiveProfile: getActiveProfile,
    createProfile: createProfile,
    switchProfile: switchProfile,
    deleteProfile: deleteProfile,
    lock: lock,
    unlock: unlock,
    isLocked: isLocked,
    load: load,
    render: render,
    init: init
  };
});
