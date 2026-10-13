import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Publish the explicitly approved, validated diagram—not local Context or receipts.
const architecture = new URL('../apps/web/dist/architecture/', import.meta.url);
mkdirSync(fileURLToPath(architecture), { recursive: true });
for (const file of ['index.html', 'hld.html', 'lld.html', 'overview.html']) {
  copyFileSync(new URL(`../docs/architecture/${file}`, import.meta.url), new URL(file, architecture));
}
writeFileSync(new URL('../apps/web/dist/.nojekyll', import.meta.url), '');
