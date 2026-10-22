import { describe, it, expect } from 'vitest';
import { trimObjectivesOrOutcomes } from './state-machine-parser.mjs';

describe('trimObjectivesOrOutcomes', () => {
  it('stops objectives before embedded module heading', () => {
    const raw =
      'Enable students to understand labour relations.\n#### Module 1: INDUSTRIAL RELATIONS CODE\n1. Topic line';
    expect(trimObjectivesOrOutcomes(raw)).toBe('Enable students to understand labour relations.');
  });

  it('stops objectives before inline Module: line', () => {
    const raw =
      'Course aims at industrial harmony and dispute resolution. Module 2: STRIKES AND LOCKOUTS extra';
    expect(trimObjectivesOrOutcomes(raw)).toBe(
      'Course aims at industrial harmony and dispute resolution.',
    );
  });
});
