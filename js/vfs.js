/* vfs.js: PipOS Virtual POSIX File System (PipFS)
   A zero-dependency in-memory and persistent virtual file system
   providing standard POSIX hierarchical paths, file operations,
   and directory traversal. Connects directly to Pip's Terminal & Editor. */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var PIP = (root.PIP = root.PIP || {});

  // In-memory file system tree
  var rootNode = {
    type: 'dir',
    name: '',
    children: {
      home: {
        type: 'dir',
        name: 'home',
        children: {
          pip: {
            type: 'dir',
            name: 'pip',
            children: {
              desktop: {
                type: 'dir',
                name: 'desktop',
                children: {
                  'welcome.txt': {
                    type: 'file',
                    name: 'welcome.txt',
                    content: 'Welcome to PipOS 10.0 — The Midnight Nursery Operating System.\nEnjoy engineering dreams and lullabies!',
                    mtime: Date.now()
                  }
                }
              },
              documents: {
                type: 'dir',
                name: 'documents',
                children: {
                  'lullaby_notes.md': {
                    type: 'file',
                    name: 'lullaby_notes.md',
                    content: '# Midnight Lullaby\n1. Five crooked notes taught eleven ghosts how to yawn.\n2. Scale: Pentatonic C4-A4.',
                    mtime: Date.now()
                  }
                }
              }
            }
          }
        }
      },
      system: {
        type: 'dir',
        name: 'system',
        children: {
          config: {
            type: 'dir',
            name: 'config',
            children: {
              'theme.json': {
                type: 'file',
                name: 'theme.json',
                content: '{"defaultTheme":"auto","supported":["day","night","contrast"]}',
                mtime: Date.now()
              }
            }
          }
        }
      }
    }
  };

  // Normalize path segments (handles . and ..)
  function normalizePath(pathStr) {
    if (!pathStr || typeof pathStr !== 'string') return '/';
    var clean = pathStr.replace(/\\/g, '/');
    if (clean.indexOf('~') === 0) {
      clean = '/home/pip' + clean.slice(1);
    }
    if (clean.charAt(0) !== '/') {
      clean = '/' + clean;
    }

    var parts = clean.split('/').filter(Boolean);
    var stack = [];

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === '.') continue;
      if (p === '..') {
        if (stack.length) stack.pop();
      } else {
        stack.push(p);
      }
    }

    return '/' + stack.join('/');
  }

  function resolvePath(currentDir, targetPath) {
    if (!targetPath) return currentDir || '/home/pip';
    if (targetPath.charAt(0) === '/' || targetPath.charAt(0) === '~') {
      return normalizePath(targetPath);
    }
    var base = currentDir || '/home/pip';
    return normalizePath(base + '/' + targetPath);
  }

  // Traversal helper
  function getNode(pathStr) {
    var norm = normalizePath(pathStr);
    if (norm === '/') return rootNode;

    var parts = norm.split('/').filter(Boolean);
    var curr = rootNode;

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!curr.children || !curr.children[p]) {
        return null;
      }
      curr = curr.children[p];
    }
    return curr;
  }

  function exists(pathStr) {
    return getNode(pathStr) !== null;
  }

  function isDirectory(pathStr) {
    var n = getNode(pathStr);
    return n !== null && n.type === 'dir';
  }

  function readFile(pathStr) {
    var n = getNode(pathStr);
    if (!n) {
      throw new Error('PipFS: No such file: ' + pathStr);
    }
    if (n.type !== 'file') {
      throw new Error('PipFS: Is a directory: ' + pathStr);
    }
    return n.content || '';
  }

  function writeFile(pathStr, content) {
    var norm = normalizePath(pathStr);
    var parts = norm.split('/').filter(Boolean);
    if (!parts.length) {
      throw new Error('PipFS: Cannot write to root directory');
    }

    var fileName = parts.pop();
    var parentPath = '/' + parts.join('/');
    var parent = getNode(parentPath);

    if (!parent) {
      throw new Error('PipFS: Directory does not exist: ' + parentPath);
    }
    if (parent.type !== 'dir') {
      throw new Error('PipFS: Parent path is not a directory: ' + parentPath);
    }

    parent.children = parent.children || {};
    parent.children[fileName] = {
      type: 'file',
      name: fileName,
      content: String(content || ''),
      mtime: Date.now()
    };
    return true;
  }

  function mkdir(pathStr) {
    var norm = normalizePath(pathStr);
    var parts = norm.split('/').filter(Boolean);
    var curr = rootNode;

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      curr.children = curr.children || {};
      if (!curr.children[p]) {
        curr.children[p] = {
          type: 'dir',
          name: p,
          children: {}
        };
      } else if (curr.children[p].type !== 'dir') {
        throw new Error('PipFS: Cannot create directory over file: ' + p);
      }
      curr = curr.children[p];
    }
    return true;
  }

  function readDir(pathStr) {
    var n = getNode(pathStr);
    if (!n) {
      throw new Error('PipFS: No such directory: ' + pathStr);
    }
    if (n.type !== 'dir') {
      throw new Error('PipFS: Not a directory: ' + pathStr);
    }

    var list = [];
    for (var k in n.children) {
      if (n.children.hasOwnProperty(k)) {
        list.push({
          name: k,
          type: n.children[k].type,
          size: n.children[k].type === 'file' ? (n.children[k].content || '').length : 0,
          mtime: n.children[k].mtime || Date.now()
        });
      }
    }
    return list;
  }

  function unlink(pathStr) {
    var norm = normalizePath(pathStr);
    var parts = norm.split('/').filter(Boolean);
    if (!parts.length) {
      throw new Error('PipFS: Cannot delete root');
    }

    var name = parts.pop();
    var parent = getNode('/' + parts.join('/'));
    if (!parent || !parent.children || !parent.children[name]) {
      throw new Error('PipFS: File not found: ' + pathStr);
    }
    delete parent.children[name];
    return true;
  }

  var PipFS = {
    normalizePath: normalizePath,
    resolvePath: resolvePath,
    exists: exists,
    isDirectory: isDirectory,
    readFile: readFile,
    writeFile: writeFile,
    mkdir: mkdir,
    readDir: readDir,
    unlink: unlink
  };

  PIP.fs = PipFS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipFS;
  }
})();
