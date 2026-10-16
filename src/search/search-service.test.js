import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initSearchService, search, pickRoute } from './search-service.js';
import { rankSearchResults } from './rank-results.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
let searchIndex;

beforeAll(() => {
  searchIndex = JSON.parse(readFileSync(join(root, 'data/generated/search-index.json'), 'utf8'));
  initSearchService(searchIndex);
});

describe('search-service integration', () => {
  it('finds topic in different 3yr semester without route context', () => {
    const { results } = search({
      query: 'Law of Evidence',
      preferredProgrammeId: 'llb-3yr',
      limit: 20,
    });
    expect(results.some((r) => r.subjectSlug === 'law-of-evidence')).toBe(true);
  });

  it('finds 5yr-only foundation subject from 3yr preference', () => {
    const { results } = search({
      query: 'English I',
      preferredProgrammeId: 'llb-3yr',
      programmeId: 'llb-5yr',
      limit: 10,
    });
    expect(results.some((r) => r.subjectSlug === 'english-i')).toBe(true);
  });

  it('BNS alias surfaces IPC syllabus content', () => {
    const { results, matchedAliases } = search({
      query: 'BNS',
      preferredProgrammeId: 'llb-3yr',
      limit: 30,
    });
    expect(matchedAliases.length).toBeGreaterThan(0);
    expect(results.some((r) => (r.searchTextRaw || '').toLowerCase().includes('indian penal code'))).toBe(
      true,
    );
  });

  it('IPC direct query hits law of crimes', () => {
    const { results } = search({
      query: 'Indian Penal Code',
      preferredProgrammeId: 'llb-3yr',
      limit: 15,
    });
    expect(results.some((r) => r.subjectSlug === 'law-of-crimes')).toBe(true);
  });

  it('pickRoute prefers 5yr when active programme is 5yr', () => {
    const doc = searchIndex.documents.find(
      (d) => d.subjectSlug === 'law-of-crimes' && d.recordType === 'topic',
    );
    const route = pickRoute(doc, 'llb-5yr', '');
    expect(route.programmeId).toBe('llb-5yr');
    expect(route.path).toContain('llb-5yr/sem-6');
  });

  it('filters by semester', () => {
    const { results } = search({
      query: 'contract',
      semesterId: 'sem-1',
      programmeId: 'llb-3yr',
      preferredProgrammeId: 'llb-3yr',
      limit: 20,
    });
    expect(results.every((r) => r.routes.some((rt) => rt.semesterId === 'sem-1'))).toBe(true);
  });

  it('handles empty query without error', () => {
    const { results, error } = search({ query: '', preferredProgrammeId: 'llb-3yr' });
    expect(results).toEqual([]);
    expect(error).toBeNull();
  });
});

describe('rankSearchResults', () => {
  it('ranks exact title match above body', () => {
    const docs = new Map([
      ['a', { id: 'a', displayTitle: 'Murder', recordType: 'topic' }],
      ['b', { id: 'b', displayTitle: 'Misc', recordType: 'reading' }],
    ]);
    const ranked = rankSearchResults('Murder', [
      { id: 'b', score: 10 },
      { id: 'a', score: 2 },
    ], docs);
    expect(ranked[0].id).toBe('a');
  });
});
