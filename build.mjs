
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

execSync('npx vite build --config vite.config.js', {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

console.log('Build completed.');
