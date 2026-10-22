import { describe, it, expect } from 'vitest';
import {
  semesterIsExpandable,
  subjectIsExpandable,
  moduleIsExpandable,
  expandAriaLabel,
  moduleRowIsActive,
  topicRowIsActive,
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

  it('scopes module active state to subject slug', () => {
    const resolved = {
      subject: { slug: 'labour-law-industrial-relations-1' },
      module: { id: 'module-2' },
      topic: null,
    };
    expect(moduleRowIsActive(resolved, 'labour-law-industrial-relations-1', 'module-2')).toBe(true);
    expect(moduleRowIsActive(resolved, 'law-of-torts-motor-accident-claims-and-consumer-protection', 'module-2')).toBe(
      false,
    );
  });

  it('scopes topic active state to subject and module', () => {
    const resolved = {
      subject: { slug: 'a' },
      module: { id: 'module-1' },
      topic: { id: 'topic-x' },
    };
    expect(topicRowIsActive(resolved, 'a', 'module-1', 'topic-x')).toBe(true);
    expect(topicRowIsActive(resolved, 'b', 'module-1', 'topic-x')).toBe(false);
  });
});
