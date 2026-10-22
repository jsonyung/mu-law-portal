import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initSearchService, search, pickRoute } from './search-service.js';
import { rankSearchResults } from './rank-results.js';
import { buildNavigationTarget } from './navigation-target.js';

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
    expect(
      results.some(
        (r) =>
          (r.searchText || r.excerptSource || '').toLowerCase().includes('indian penal code'),
      ),
    ).toBe(true);
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

  it('ranks Law of Crimes subject above unrelated weak IPC reading matches when both exist', () => {
    const { results } = search({ query: 'LAW OF CRIMES', preferredProgrammeId: 'llb-3yr', limit: 10 });
    expect(results[0]?.recordType).toBe('subject');
    expect(results[0]?.subjectSlug).toBe('law-of-crimes');
  });

  it('tort query ranks Law of Torts subject highly', () => {
    const { results } = search({ query: 'tort', preferredProgrammeId: 'llb-3yr', limit: 15 });
    const tortsSubject = results.find((r) => r.subjectSlug?.includes('law-of-torts'));
    expect(tortsSubject).toBeTruthy();
    expect(results.indexOf(tortsSubject)).toBeLessThan(5);
  });

  it('attaches navigationTarget with topic path for torts topic results', () => {
    const { results } = search({
      query: 'tort definition nature scope',
      preferredProgrammeId: 'llb-3yr',
      limit: 5,
    });
    const topic = results.find((r) => r.recordType === 'topic' && r.topicId?.includes('tort-definition'));
    expect(topic?.navigationTarget?.topicId).toBeTruthy();
    expect(topic?.navigationTarget?.hash).toContain('/module-1/');
  });

  it('IPC reading result navigates to law-of-crimes readings anchor', () => {
    const { results } = search({ query: 'Mulla IPC', preferredProgrammeId: 'llb-3yr', limit: 20 });
    const reading = results.find((r) => r.recordType === 'reading' && r.displayTitle.toLowerCase().includes('ipc'));
    expect(reading).toBeTruthy();
    const target = buildNavigationTarget(reading, 'llb-3yr', '');
    expect(target.subjectSlug).toBe('law-of-crimes');
    expect(target.readingAnchorId).toBeTruthy();
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
