import { describe, it, expect } from 'vitest';
import { formatReadingLine, programmeDescription } from './dom.js';

describe('dom presentation helpers', () => {
  it('strips leading dot prefix from reading lines', () => {
    expect(formatReadingLine('. The Criminal Law Manual')).toBe('The Criminal Law Manual');
  });

  it('describes 3-year programme semester span', () => {
    const prog = { id: 'llb-3yr', semesters: ['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6'] };
    expect(programmeDescription(prog)).toContain('Semesters I–VI');
  });
});
