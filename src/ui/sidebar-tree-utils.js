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

/** Module ids repeat across subjects (module-1, module-2); scope active state by subject. */
export function moduleRowIsActive(resolved, subjectSlug, moduleId) {
  return (
    resolved?.subject?.slug === subjectSlug &&
    resolved?.module?.id === moduleId &&
    !resolved?.topic
  );
}

export function moduleRowIsExpanded(resolved, subjectSlug, moduleId, storedExpanded) {
  if (storedExpanded != null) return storedExpanded;
  return moduleRowIsActive(resolved, subjectSlug, moduleId);
}

export function topicRowIsActive(resolved, subjectSlug, moduleId, topicId) {
  return (
    resolved?.subject?.slug === subjectSlug &&
    resolved?.module?.id === moduleId &&
    resolved?.topic?.id === topicId
  );
}
