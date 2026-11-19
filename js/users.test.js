const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const users = require('./users.js');

describe('Multi-User Profile Switcher & Screen Lock Sandbox (pip-users)', () => {
  beforeEach(() => {
    // Reset or ensure default profile
    const profiles = users.getProfiles();
    if (profiles.length > 0) {
      users.switchProfile(profiles[0].id);
    }
  });

  test('getProfiles returns default profiles with name and avatar', () => {
    const list = users.getProfiles();
    assert.ok(list.length >= 2);
    assert.ok(list.some(p => p.id === 'user_default'));
  });

  test('createProfile adds new profile with custom avatar and properties', () => {
    const p = users.createProfile('Little Owl Tester', '🦉', 'night', '1234');
    assert.strictEqual(p.name, 'Little Owl Tester');
    assert.strictEqual(p.avatar, '🦉');
    assert.strictEqual(p.theme, 'night');
    assert.strictEqual(p.pin, '1234');

    const updated = users.getProfiles();
    assert.ok(updated.some(x => x.id === p.id));
  });

  test('switchProfile activates targeted profile', () => {
    const list = users.getProfiles();
    const target = list[1];
    const success = users.switchProfile(target.id);
    assert.strictEqual(success, true);

    const active = users.getActiveProfile();
    assert.strictEqual(active.id, target.id);
  });

  test('lock and unlock manage locked state and check PIN', () => {
    // Create profile with PIN
    const secureUser = users.createProfile('Secure Explorer', '🚀', 'default', '9999');
    users.switchProfile(secureUser.id);

    users.lock();
    assert.strictEqual(users.isLocked(), true);

    // Wrong pin fails
    const failUnlock = users.unlock('0000');
    assert.strictEqual(failUnlock, false);
    assert.strictEqual(users.isLocked(), true);

    // Correct pin succeeds
    const successUnlock = users.unlock('9999');
    assert.strictEqual(successUnlock, true);
    assert.strictEqual(users.isLocked(), false);
  });

  test('index.html contains #usersWin window, #lockScreen overlay, and script tag', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="usersWin"'), 'index.html must include #usersWin window');
    assert.ok(html.includes('id="usersList"'), 'index.html must include #usersList');
    assert.ok(html.includes('id="usersLockBtn"'), 'index.html must include #usersLockBtn');
    assert.ok(html.includes('id="lockScreen"'), 'index.html must include #lockScreen overlay');
    assert.ok(html.includes('id="lockUnlockBtn"'), 'index.html must include #lockUnlockBtn');
    assert.ok(html.includes('src="js/users.js"'), 'index.html must include js/users.js script tag');
  });
});
