import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { jest } from '@jest/globals';

const root = new URL('../../../../../', import.meta.url);
const docs = new URL('docs/architecture/', root);
describe('published architecture documentation', () => {
  it('links both diagrams, detailed sections and existing source components', () => {
    const guide = readFileSync(new URL('index.html', docs), 'utf8');
    for (const section of ['hld', 'lld', 'flows', 'contracts', 'limits']) expect(guide).toContain(`id="${section}"`);
    for (const file of ['hld.html', 'lld.html', 'overview.html']) {
      expect(guide).toContain(`href="${file}"`); expect(existsSync(new URL(file, docs))).toBe(true);
    }
    for (const [, path] of guide.matchAll(/data-source="([^"]+)"/g)) expect(existsSync(new URL(path, root))).toBe(true);
    expect(guide).toContain('Pending verification/features');
  });
  it('packages only approved HTML, not source notes, secrets or machine receipts', () => {
    const script = new URL('scripts/prepare-pages.mjs', root);
    const source = readFileSync(script, 'utf8').replace(/^import .*;$/gm, '')
      .replaceAll('import.meta.url', JSON.stringify(script.href));
    const copy = jest.fn(); const write = jest.fn();
    runInNewContext(source, { URL, fileURLToPath, mkdirSync: jest.fn(), copyFileSync: copy, writeFileSync: write });
    expect(copy).toHaveBeenCalledTimes(4);
    expect(copy.mock.calls.map(([input]) => String(input).split('/').pop())).toEqual(['index.html', 'hld.html', 'lld.html', 'overview.html']);
    for (const [, output] of copy.mock.calls) expect(String(output)).toContain('/apps/web/dist/architecture/');
    expect(String(write.mock.calls[0][0])).toContain('/apps/web/dist/.nojekyll');
  });
});
