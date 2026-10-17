import { describe, it, expect } from 'vitest';
import {
  semesterIsExpandable,
  subjectIsExpandable,
  moduleIsExpandable,
  expandAriaLabel,
} from './sidebar-tree-utils.js';

describe('sidebar-tree-utils', () => {
  it('detects expandable semester when subjects exist', () => {
    expect(semesterIsExpandable([])).toBe(false);
    expect(semesterIsExpandable(['a'])).toBe(true);
  });

  it('detects expandable subject when modules exist', () => {
    expect(subjectIsExpandable({ modules: [] })).toBe(false);
    expect(subjectIsExpandable({ modules: [{ id: 'm1', topics: [] }] })).toBe(true);
  });

  it('detects expandable module when topics exist', () => {
    expect(moduleIsExpandable({ topics: [] })).toBe(false);
    expect(moduleIsExpandable({ topics: [{ id: 't1' }] })).toBe(true);
  });

  it('builds expand/collapse aria labels', () => {
    expect(expandAriaLabel(false, 'Semester I')).toBe('Expand Semester I');
    expect(expandAriaLabel(true, 'Semester I')).toBe('Collapse Semester I');
  });
});
