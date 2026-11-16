import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcRoot = path.join(__dirname, 'front-end');
const distRoot = path.join(__dirname, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  fs.cpSync(srcDir, destDir, { recursive: true });
}

execSync('npx vite build front-end --outDir ../dist', {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

ensureDir(distRoot);

const filesToCopy = [
  ['search.html', 'search.html'],
  ['app.js', 'app.js'],
  ['js', 'js'],
  ['css', 'css'],
  ['icon-img', 'icon-img'],
];

for (const [from, to] of filesToCopy) {
  const srcPath = path.join(srcRoot, from);
  const destPath = path.join(distRoot, to);

  if (!fs.existsSync(srcPath)) {
    continue;
  }

  if (fs.statSync(srcPath).isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    ensureDir(path.dirname(destPath));
    fs.copyFileSync(srcPath, destPath);
  }
}

console.log('Build completed. Static pages copied to dist.');
