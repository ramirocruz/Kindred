import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Publish the explicitly approved, validated diagram—not local Context or receipts.
const architecture = new URL('../apps/web/dist/architecture/', import.meta.url);
mkdirSync(fileURLToPath(architecture), { recursive: true });
copyFileSync(new URL('../docs/architecture/index.html', import.meta.url), new URL('index.html', architecture));
writeFileSync(new URL('../apps/web/dist/.nojekyll', import.meta.url), '');
