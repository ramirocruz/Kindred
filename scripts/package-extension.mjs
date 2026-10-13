import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../extensions/gdrive/', import.meta.url));
const destination = fileURLToPath(new URL('../apps/web/public/downloads/kindred-gdrive-extension.zip', import.meta.url));
mkdirSync(fileURLToPath(new URL('../apps/web/public/downloads/', import.meta.url)), { recursive: true });
const result = spawnSync('zip', ['-j', destination, 'manifest.json', 'background.js', 'room-url.js', 'media.js', 'kindred-bridge.js', 'popup.html', 'popup.js', 'README.md'], { cwd: source, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
