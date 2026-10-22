import { describe, it, expect } from 'vitest';
import { normalizeQuery, expandQueryWithAliases } from './normalize-query.js';

describe('normalizeQuery', () => {
  it('is case insensitive and collapses whitespace', () => {
    expect(normalizeQuery('  Indian   Penal  Code  ')).toBe('indian penal code');
  });

  it('normalizes punctuation', () => {
    expect(normalizeQuery('Cr.P.C')).toBe('cr.p.c');
  });
});

describe('expandQueryWithAliases', () => {
  const aliases = [
    {
      id: 'bns',
      terms: ['BNS'],
      expandTo: ['Indian Penal Code', 'IPC'],
      disclaimer: 'test',
    },
  ];

  it('expands BNS to syllabus terms', () => {
    const { expandedQuery, matchedAliases } = expandQueryWithAliases('BNS', aliases);
    expect(expandedQuery.toLowerCase()).toContain('indian penal code');
    expect(matchedAliases).toHaveLength(1);
  });
});
