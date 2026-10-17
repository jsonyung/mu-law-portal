/** Pure helpers for curriculum tree expandability (testable without DOM). */

export function semesterIsExpandable(subjects) {
  return Array.isArray(subjects) && subjects.length > 0;
}

export function subjectIsExpandable(subject) {
  return Boolean(subject?.modules?.length);
}

export function moduleIsExpandable(mod) {
  return Boolean(mod?.topics?.length);
}

export function expandAriaLabel(expanded, sectionLabel) {
  return `${expanded ? 'Collapse' : 'Expand'} ${sectionLabel}`;
}
