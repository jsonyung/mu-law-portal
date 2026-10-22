import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildNavigationTarget, buildHashFromRecord, pickProgrammeRoute } from './navigation-target.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const index = JSON.parse(readFileSync(join(root, 'data/generated/search-index.json'), 'utf8'));

function docById(id) {
  return index.documents.find((d) => d.id === id);
}

describe('navigation-target', () => {
  it('IPC Mulla reading opens law-of-crimes subject with reading anchor (not wrong subject)', () => {
    const reading = index.documents.find(
      (d) => d.recordType === 'reading' && d.displayTitle.toLowerCase().includes('mulla') && d.displayTitle.toLowerCase().includes('ipc'),
    );
    expect(reading).toBeTruthy();
    expect(reading.subjectSlug).toBe('law-of-crimes');

    const target = buildNavigationTarget(reading, 'llb-3yr', '');
    expect(target.hash).toBe('#/llb-3yr/sem-2/law-of-crimes');
    expect(target.readingAnchorId).toMatch(/^reading-law-of-crimes-\d+$/);
    expect(target.recordType).toBe('reading');
  });

  it('Law of Crimes subject opens subject-only hash', () => {
    const subject = docById('subject:law-of-crimes');
    const target = buildNavigationTarget(subject, 'llb-5yr', '');
    expect(target.hash).toBe('#/llb-5yr/sem-6/law-of-crimes');
    expect(target.topicId).toBeNull();
  });

  it('torts topic opens exact module and topic slug path', () => {
    const topic = index.documents.find(
      (d) =>
        d.recordType === 'topic' &&
        d.subjectSlug === 'law-of-torts-motor-accident-claims-and-consumer-protection' &&
        d.topicId === 'tort-definition-nature-scope-and-object-of-tort-tort-in',
    );
    expect(topic).toBeTruthy();
    const target = buildNavigationTarget(topic, 'llb-3yr', '');
    expect(target.hash).toContain('/module-1/tort-definition-nature-scope-and-object-of-tort-tort-in');
    expect(target.topicId).toBe('tort-definition-nature-scope-and-object-of-tort-tort-in');
  });

  it('shared subject uses 5-year route when preferred programme is 5-year', () => {
    const topic = index.documents.find((d) => d.recordType === 'topic' && d.subjectSlug === 'law-of-crimes');
    const target = buildNavigationTarget(topic, 'llb-5yr', '');
    expect(target.hash.startsWith('#/llb-5yr/sem-6/')).toBe(true);
  });

  it('duplicate-title topics differ by stable hierarchical ids', () => {
    const topics = index.documents.filter((d) => d.recordType === 'topic' && d.displayTitle === d.topicTitle);
    const byTitle = new Map();
    for (const t of topics) {
      const key = `${t.subjectSlug}::${t.displayTitle}`;
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(t.id);
    }
    const dupGroups = [...byTitle.values()].filter((ids) => ids.length > 1);
    for (const ids of dupGroups) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('pickProgrammeRoute prefers requested programme', () => {
    const topic = index.documents.find((d) => d.subjectSlug === 'law-of-crimes' && d.recordType === 'topic');
    const route = pickProgrammeRoute(topic, 'llb-5yr', '');
    expect(route.programmeId).toBe('llb-5yr');
    expect(buildHashFromRecord(topic, route)).toContain('llb-5yr/sem-6');
  });
});
