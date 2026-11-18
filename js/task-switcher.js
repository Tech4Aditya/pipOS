/* task-switcher.js: PipOS Retro Process Switcher (Alt+Tab)
   Implements a classic retro floating task switcher modal on Alt+Tab / Ctrl+Tab,
   enabling seamless keyboard cycling between open nursery windows and diagnostics.
   100% build-free and zero-dependency. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  var activeIndex = 0;
  var isVisible = false;
  var cachedWindows = [];

  function $(sel, r) {
    if (root.PIP && root.PIP.$) return root.PIP.$(sel, r);
    return (r || document).querySelector(sel);
  }

  function $$(sel, r) {
    if (root.PIP && root.PIP.$$) return root.PIP.$$(sel, r);
    return Array.prototype.slice.call((r || document).querySelectorAll(sel));
  }

  function getOpenWindows() {
    if (!root.document) return [];
    var list = [];
    $$('.win').forEach(function (win) {
      if (win.id && win.id !== 'hello') {
        var titleEl = win.querySelector('.win-title');
        list.push({
          id: win.id,
          title: titleEl ? titleEl.textContent.trim() : win.id,
          el: win
        });
      }
    });
    return list;
  }

  function cycleNext(count, current) {
    if (count <= 0) return 0;
    return (current + 1) % count;
  }

  function cyclePrev(count, current) {
    if (count <= 0) return 0;
    return (current - 1 + count) % count;
  }

  function showModal() {
    cachedWindows = getOpenWindows();
    if (!cachedWindows.length) return;

    var modal = $('#taskSwitcherModal');
    if (!modal) return;

    activeIndex = 0;
    isVisible = true;
    modal.hidden = false;
    modal.classList.add('is-open');

    renderList();
  }

  function renderList() {
    var listEl = $('#taskSwitcherList');
    if (!listEl) return;

    listEl.innerHTML = '';
    cachedWindows.forEach(function (w, i) {
      var item = document.createElement('div');
      item.className = 'switcher-item' + (i === activeIndex ? ' is-selected' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');

      var icon = document.createElement('span');
      icon.className = 'switcher-icon';
      icon.textContent = '🪟';

      var label = document.createElement('span');
      label.className = 'switcher-label';
      label.textContent = w.title;

      item.appendChild(icon);
      item.appendChild(label);
      listEl.appendChild(item);
    });
  }

  function hideModal() {
    var modal = $('#taskSwitcherModal');
    if (modal) {
      modal.hidden = true;
      modal.classList.remove('is-open');
    }
    isVisible = false;

    if (cachedWindows.length && cachedWindows[activeIndex]) {
      var targetWin = cachedWindows[activeIndex].el;
      if (targetWin) {
        if (PIP.wm && PIP.wm.bringToFront) {
          PIP.wm.bringToFront(targetWin);
        }
        targetWin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        var bar = targetWin.querySelector('.win-bar');
        if (bar && bar.focus) bar.focus();
      }
    }
  }

  function init() {
    if (!root.document) return;

    // Listen for Alt + Tab or Ctrl + Tab
    root.document.addEventListener('keydown', function (e) {
      if ((e.altKey || e.ctrlKey) && e.key === 'Tab') {
        e.preventDefault();
        if (!isVisible) {
          showModal();
        } else {
          activeIndex = e.shiftKey
            ? cyclePrev(cachedWindows.length, activeIndex)
            : cycleNext(cachedWindows.length, activeIndex);
          renderList();
        }
      }

      // Quick shortcut: Ctrl + Shift + Escape to open Resource Monitor
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        var mon = $('#monitor');
        if (mon) {
          if (PIP.wm && PIP.wm.bringToFront) PIP.wm.bringToFront(mon);
          mon.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    root.document.addEventListener('keyup', function (e) {
      if (isVisible && (e.key === 'Alt' || e.key === 'Control')) {
        hideModal();
      }
    });
  }

  var Switcher = {
    init: init,
    getOpenWindows: getOpenWindows,
    cycleNext: cycleNext,
    cyclePrev: cyclePrev,
    showModal: showModal,
    hideModal: hideModal,
    isModalOpen: function () { return isVisible; }
  };

  PIP.switcher = Switcher;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Switcher;
  }
})();
