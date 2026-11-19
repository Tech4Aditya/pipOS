const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const notifications = require('./notifications.js');

describe('Taskbar Notification Center & Do-Not-Disturb Drawer (pip-notifications)', () => {
  beforeEach(() => {
    notifications.load();
    notifications.clearAll();
  });

  test('push adds notification to history with category and increments unread count', () => {
    const notif = notifications.push('Starlight Bloom', 'Your celestial moonflower bloomed!', 'starlight');
    assert.strictEqual(notif.title, 'Starlight Bloom');
    assert.strictEqual(notif.category, 'starlight');
    assert.strictEqual(notif.read, false);

    const list = notifications.getNotifications();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(notifications.getUnreadCount(), 1);
  });

  test('markAllRead marks unread notifications as read and clears unread counter', () => {
    notifications.push('Event 1', 'Message 1', 'system');
    notifications.push('Event 2', 'Message 2', 'audio');
    assert.strictEqual(notifications.getUnreadCount(), 2);

    notifications.markAllRead();
    assert.strictEqual(notifications.getUnreadCount(), 0);
  });

  test('toggleDnd enables and disables Do-Not-Disturb mode', () => {
    const initialDnd = notifications.isDnd();
    const toggled = notifications.toggleDnd();
    assert.strictEqual(toggled, !initialDnd);
    assert.strictEqual(notifications.isDnd(), toggled);

    notifications.toggleDnd(); // Restore
  });

  test('remove deletes specific notification by id', () => {
    const n = notifications.push('Deletable', 'To delete', 'security');
    assert.strictEqual(notifications.getNotifications().length, 1);

    const ok = notifications.remove(n.id);
    assert.strictEqual(ok, true);
    assert.strictEqual(notifications.getNotifications().length, 0);
  });

  test('index.html contains #notifBell, #notifBadge, #notifCenter drawer, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="notifBell"'), 'index.html must include #notifBell in topbar');
    assert.ok(html.includes('id="notifBadge"'), 'index.html must include #notifBadge');
    assert.ok(html.includes('id="notifCenter"'), 'index.html must include #notifCenter drawer');
    assert.ok(html.includes('id="notifList"'), 'index.html must include #notifList');
    assert.ok(html.includes('id="notifDndBtn"'), 'index.html must include #notifDndBtn');
    assert.ok(html.includes('src="js/notifications.js"'), 'index.html must include js/notifications.js script tag');
  });
});
