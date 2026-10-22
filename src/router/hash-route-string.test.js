import { describe, it, expect } from 'vitest';
import { parseHashRoute } from './hash-route-string.js';

describe('parseHashRoute', () => {
  it('parses route with secondary anchor for subject readings', () => {
    const route = parseHashRoute('#/llb-3yr/sem-1/law-of-crimes#subject-readings');
    expect(route.subject).toBe('law-of-crimes');
    expect(route.routeAnchor).toBe('subject-readings');
  });
});
