import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../../../Context/', import.meta.url);
const files = readdirSync(root).filter((name) => name.endsWith('.md'));

describe('compact project memory contracts', () => {
  it('keeps active notes bounded and their relative links valid', () => {
    for (const file of files) {
      const url = new URL(file, root);
      const text = readFileSync(url, 'utf8');
      const limit = file === 'current.md' ? 80 : file === 'index.md' ? 60 : 120;
      expect(text.trimEnd().split('\n').length).toBeLessThanOrEqual(limit);
      for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1];
        if (/^https?:/.test(target)) continue;
        expect(existsSync(fileURLToPath(new URL(target.split('#')[0], url)))).toBe(true);
      }
    }
  });
  it('tracks sanitized notes without machine paths or invitation secrets', () => {
    const ignore = readFileSync(new URL('../../../../../.gitignore', import.meta.url), 'utf8');
    expect(ignore.split('\n')).not.toContain('Context/');
    for (const file of [...files, ...readdirSync(new URL('archive/', root)).map((name) => `archive/${name}`)]) {
      const text = readFileSync(new URL(file, root), 'utf8');
      expect(text).not.toMatch(/\/Users\/|\/private\/|\/var\/folders\/|chatKey=[A-Za-z0-9_-]+|BEGIN .*PRIVATE KEY/);
      expect(text).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    }
  });
});
