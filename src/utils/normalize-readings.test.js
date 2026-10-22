import { describe, it, expect } from 'vitest';
import { normalizeReadingList } from './normalize-readings.js';

describe('normalizeReadingList', () => {
  it('merges edition fragments split across lines', () => {
    const raw = [
      'M. Rao, O.P. Malhotra‘s The law of Industrial Disputes(6 ed., 2004)',
      'th',
      'Bare Act: Industrial Relations Code 2020',
    ];
    expect(normalizeReadingList(raw)).toEqual([
      'M. Rao, O.P. Malhotra‘s The law of Industrial Disputes(6th ed., 2004)',
      'Bare Act: Industrial Relations Code 2020',
    ]);
  });

  it('merges wrapped title continuations', () => {
    const raw = [
      'L.Malik, K.D. Srivastava‘s Law Relating to Trade Unions and Unfair Labour Practices',
      'in India (4 ed., 2002, with Supplement 2003)',
      'th',
    ];
    const out = normalizeReadingList(raw);
    expect(out.length).toBe(1);
    expect(out[0]).toContain('in India (4th ed., 2002');
    expect(out[0]).not.toMatch(/\bth\b$/);
  });
});
