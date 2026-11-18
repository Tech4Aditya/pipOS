'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const PipFS = require('./vfs.js');

test('PipFS: normalizePath cleans up redundant slashes and relative dots', () => {
  assert.strictEqual(PipFS.normalizePath('/home/pip/../pip/./desktop'), '/home/pip/desktop');
  assert.strictEqual(PipFS.normalizePath('~/documents'), '/home/pip/documents');
  assert.strictEqual(PipFS.normalizePath('///home//pip///'), '/home/pip');
  assert.strictEqual(PipFS.normalizePath('/'), '/');
});

test('PipFS: resolvePath correctly evaluates relative paths from cwd', () => {
  assert.strictEqual(PipFS.resolvePath('/home/pip', 'documents'), '/home/pip/documents');
  assert.strictEqual(PipFS.resolvePath('/home/pip', '..'), '/home');
  assert.strictEqual(PipFS.resolvePath('/home/pip', '/system/config'), '/system/config');
});

test('PipFS: readDir lists initial directory contents', () => {
  const contents = PipFS.readDir('/home/pip/desktop');
  assert.ok(Array.isArray(contents));
  assert.strictEqual(contents.length >= 1, true);
  assert.strictEqual(contents[0].name, 'welcome.txt');
  assert.strictEqual(contents[0].type, 'file');
});

test('PipFS: readFile retrieves file content', () => {
  const text = PipFS.readFile('/home/pip/desktop/welcome.txt');
  assert.ok(text.includes('Welcome to PipOS'));
});

test('PipFS: writeFile creates and overwrites file', () => {
  PipFS.writeFile('/home/pip/desktop/test_note.txt', 'Starlight test content');
  const readBack = PipFS.readFile('/home/pip/desktop/test_note.txt');
  assert.strictEqual(readBack, 'Starlight test content');
});

test('PipFS: mkdir creates nested directory hierarchy', () => {
  PipFS.mkdir('/home/pip/music/lullabies');
  assert.strictEqual(PipFS.isDirectory('/home/pip/music/lullabies'), true);

  PipFS.writeFile('/home/pip/music/lullabies/track1.txt', 'Note C4');
  assert.strictEqual(PipFS.readFile('/home/pip/music/lullabies/track1.txt'), 'Note C4');
});

test('PipFS: unlink deletes file successfully', () => {
  PipFS.writeFile('/home/pip/desktop/temp.txt', 'Delete me');
  assert.strictEqual(PipFS.exists('/home/pip/desktop/temp.txt'), true);

  PipFS.unlink('/home/pip/desktop/temp.txt');
  assert.strictEqual(PipFS.exists('/home/pip/desktop/temp.txt'), false);
});

test('PipFS: throws expected errors for non-existent paths', () => {
  assert.throws(() => {
    PipFS.readFile('/non/existent/path.txt');
  }, /No such file/);
});
