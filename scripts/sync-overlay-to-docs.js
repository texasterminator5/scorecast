/**
 * Copies scoreboard-overlay static assets into docs/ for GitHub Pages
 * (branch: main, folder: /docs). Run after editing overlay files:
 *   node scripts/sync-overlay-to-docs.js
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'scoreboard-overlay');
const dstDir = path.join(root, 'docs');

const FILES = ['index.html', 'control.html', 'logo.png'];

fs.mkdirSync(dstDir, { recursive: true });
for (const name of FILES) {
  fs.copyFileSync(path.join(srcDir, name), path.join(dstDir, name));
}
fs.writeFileSync(path.join(dstDir, '.nojekyll'), '');

const nestedDir = path.join(dstDir, 'scoreboard-overlay');
fs.mkdirSync(nestedDir, { recursive: true });
for (const name of FILES) {
  fs.copyFileSync(path.join(srcDir, name), path.join(nestedDir, name));
}

console.log('Synced scoreboard-overlay → docs/ and docs/scoreboard-overlay/ (with .nojekyll)');
