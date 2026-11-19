/**
 * js/notifications.js
 * Taskbar Notification Center & Do-Not-Disturb Drawer (pip-notifications)
 * Pure vanilla ES6 implementation with zero external dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PIP = root.PIP || {};
    root.PIP.notifications = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'pipos_notifications_history';
  var DND_KEY = 'pipos_dnd_enabled';
  var MAX_HISTORY = 30;

  var ICONS = {
    system: '⚙️',
    starlight: '🌟',
    audio: '🎵',
    security: '🛡️'
  };

  var state = {
    notifications: [],
    dnd: false,
    isOpen: false,
    filter: 'all'
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
        state.notifications = JSON.parse(raw);
      }
    } catch (_) {
      state.notifications = [];
    }

    try {
      state.dnd = store.getItem(DND_KEY) === 'true';
    } catch (_) {
      state.dnd = false;
    }
  }

  function save() {
    var store = getStorage();
    if (!store) return;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state.notifications));
      store.setItem(DND_KEY, state.dnd ? 'true' : 'false');
    } catch (_) {}
  }

  function generateId() {
    return 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function push(title, message, category) {
    var cat = ICONS[category] ? category : 'system';
    var notif = {
      id: generateId(),
      title: (title || 'Notification').trim(),
      message: (message || '').trim(),
      category: cat,
      timestamp: Date.now(),
      read: false
    };

    state.notifications.unshift(notif);
    if (state.notifications.length > MAX_HISTORY) {
      state.notifications = state.notifications.slice(0, MAX_HISTORY);
    }
    save();

    // Trigger visual toast only if NOT in DND mode
    if (!state.dnd && typeof document !== 'undefined') {
      var toastEl = document.getElementById('toast');
      if (toastEl) {
        toastEl.textContent = notif.title + ': ' + notif.message;
        toastEl.classList.add('is-visible');
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(function () {
          toastEl.classList.remove('is-visible');
        }, 3200);
      }
    }

    updateBadge();
    renderList();

    return notif;
  }

  function toggleDnd() {
    state.dnd = !state.dnd;
    save();
    updateDndUI();
    return state.dnd;
  }

  function isDnd() {
    return state.dnd;
  }

  function getNotifications(categoryFilter) {
    var f = categoryFilter || state.filter;
    if (!f || f === 'all') {
      return state.notifications.slice();
    }
    return state.notifications.filter(function (n) { return n.category === f; });
  }

  function getUnreadCount() {
    return state.notifications.filter(function (n) { return !n.read; }).length;
  }

  function markAllRead() {
    state.notifications.forEach(function (n) { n.read = true; });
    save();
    updateBadge();
    renderList();
  }

  function clearAll() {
    state.notifications = [];
    save();
    updateBadge();
    renderList();
  }

  function remove(id) {
    var initialLen = state.notifications.length;
    state.notifications = state.notifications.filter(function (n) { return n.id !== id; });
    var removed = state.notifications.length < initialLen;
    if (removed) {
      save();
      updateBadge();
      renderList();
    }
    return removed;
  }

  function toggleDrawer() {
    state.isOpen = !state.isOpen;
    var drawer = document.getElementById('notifCenter');
    if (drawer) {
      if (state.isOpen) {
        drawer.classList.remove('is-hidden');
        drawer.removeAttribute('inert');
        markAllRead();
      } else {
        drawer.classList.add('is-hidden');
        drawer.setAttribute('inert', '');
      }
    }
    return state.isOpen;
  }

  function updateBadge() {
    if (typeof document === 'undefined') return;
    var badgeEl = document.getElementById('notifBadge');
    if (!badgeEl) return;
    var unread = getUnreadCount();
    if (unread > 0) {
      badgeEl.textContent = unread > 9 ? '9+' : String(unread);
      badgeEl.classList.remove('is-hidden');
    } else {
      badgeEl.classList.add('is-hidden');
    }
  }

  function updateDndUI() {
    if (typeof document === 'undefined') return;
    var dndBtn = document.getElementById('notifDndBtn');
    if (dndBtn) {
      dndBtn.textContent = state.dnd ? '🌙 DND: On' : '🔔 DND: Off';
      dndBtn.setAttribute('aria-pressed', state.dnd ? 'true' : 'false');
      if (state.dnd) dndBtn.classList.add('btn-active');
      else dndBtn.classList.remove('btn-active');
    }
  }

  function renderList() {
    if (typeof document === 'undefined') return;
    var listContainer = document.getElementById('notifList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    var items = getNotifications();
    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'notif-empty';
      empty.textContent = 'No notifications. All quiet in the nursery!';
      listContainer.appendChild(empty);
      return;
    }

    items.forEach(function (n) {
      var card = document.createElement('div');
      card.className = 'notif-item' + (!n.read ? ' is-unread' : '');

      var icon = document.createElement('span');
      icon.className = 'notif-icon';
      icon.textContent = ICONS[n.category] || '⚙️';

      var body = document.createElement('div');
      body.className = 'notif-body';

      var title = document.createElement('div');
      title.className = 'notif-title';
      title.textContent = n.title;

      var msg = document.createElement('div');
      msg.className = 'notif-msg';
      msg.textContent = n.message;

      var time = document.createElement('div');
      time.className = 'notif-time';
      var d = new Date(n.timestamp);
      time.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      body.appendChild(title);
      body.appendChild(msg);
      body.appendChild(time);

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-tiny notif-del';
      delBtn.textContent = '✕';
      delBtn.title = 'Dismiss';
      delBtn.setAttribute('aria-label', 'Dismiss notification');
      delBtn.addEventListener('click', function () {
        remove(n.id);
      });

      card.appendChild(icon);
      card.appendChild(body);
      card.appendChild(delBtn);
      listContainer.appendChild(card);
    });
  }

  function init() {
    load();

    var bellBtn = document.getElementById('notifBell');
    var closeBtn = document.getElementById('notifCloseBtn');
    var dndBtn = document.getElementById('notifDndBtn');
    var clearBtn = document.getElementById('notifClearBtn');
    var filterSelect = document.getElementById('notifFilterSelect');

    if (bellBtn) {
      bellBtn.addEventListener('click', function () {
        toggleDrawer();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        toggleDrawer();
      });
    }

    if (dndBtn) {
      dndBtn.addEventListener('click', function () {
        toggleDnd();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearAll();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', function () {
        state.filter = filterSelect.value;
        renderList();
      });
    }

    // Intercept PIP.toast to record automatically
    if (typeof window !== 'undefined' && window.PIP) {
      var oldToast = window.PIP.toast;
      window.PIP.toast = function (msg) {
        push('PipOS Event', msg, 'system');
        if (typeof oldToast === 'function' && !state.dnd) {
          oldToast(msg);
        }
      };
    }

    updateBadge();
    updateDndUI();
    renderList();
  }

  // Pre-load state
  load();

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    push: push,
    toggleDnd: toggleDnd,
    isDnd: isDnd,
    getNotifications: getNotifications,
    getUnreadCount: getUnreadCount,
    markAllRead: markAllRead,
    clearAll: clearAll,
    remove: remove,
    toggleDrawer: toggleDrawer,
    load: load,
    save: save,
    init: init
  };
});
