import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('GitHub Pages build output', () => {
  it('docs contains data json and base-aware index', () => {
    const indexPath = join(root, 'docs/index.html');
    if (!existsSync(indexPath)) {
      console.warn('docs/ not built yet — skip until npm run build');
      return;
    }
    expect(existsSync(join(root, 'docs/data/curriculum.json'))).toBe(true);
    expect(existsSync(join(root, 'docs/data/search-index.json'))).toBe(true);
    const idx = JSON.parse(readFileSync(join(root, 'docs/data/search-index.json'), 'utf8'));
    expect(idx.meta?.indexVersion).toBe(2);
    const html = readFileSync(indexPath, 'utf8');
    expect(html).toMatch(/\/mu-law-portal\//);
  });
});
