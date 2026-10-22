import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildSearchIndexV2 } from './build-search-index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const curriculum = JSON.parse(readFileSync(join(root, 'data/generated/curriculum.json'), 'utf8'));

describe('buildSearchIndexV2', () => {
  it('emits v2 meta and no duplicate ids', () => {
    const index = buildSearchIndexV2(curriculum.subjects, curriculum.subjectOrder, curriculum.meta);
    expect(index.meta.indexVersion).toBe(2);
    const ids = index.documents.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('law-of-crimes has dual programme routes on topics', () => {
    const index = buildSearchIndexV2(curriculum.subjects, curriculum.subjectOrder, curriculum.meta);
    const topic = index.documents.find(
      (d) => d.recordType === 'topic' && d.subjectSlug === 'law-of-crimes',
    );
    expect(topic).toBeTruthy();
    expect(topic.routes.length).toBeGreaterThanOrEqual(2);
    const progs = topic.routes.map((r) => r.programmeId).sort();
    expect(progs).toContain('llb-3yr');
    expect(progs).toContain('llb-5yr');
    const five = topic.routes.find((r) => r.programmeId === 'llb-5yr');
    expect(five.path).toMatch(/llb-5yr\/sem-6\//);
    const three = topic.routes.find((r) => r.programmeId === 'llb-3yr');
    expect(three.path).toMatch(/llb-3yr\/sem-2\//);
  });
});
