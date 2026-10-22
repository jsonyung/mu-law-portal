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

/**
 * Expansion precedence:
 * 1. lockOpen (active module containing current topic)
 * 2. stored === true
 * 3. stored === false
 * 4. onRouteAncestry when stored is undefined
 * 5. else collapsed
 */
export function treeRowIsExpanded({ stored, onRouteAncestry, lockOpenBecauseActiveTopic = false }) {
  if (lockOpenBecauseActiveTopic) return true;
  if (stored === true) return true;
  if (stored === false) return false;
  if (onRouteAncestry) return true;
  return false;
}

/** Module ids repeat across subjects (module-1, module-2); scope active state by subject. */
export function moduleRowIsActive(resolved, subjectSlug, moduleId) {
  return (
    resolved?.subject?.slug === subjectSlug &&
    resolved?.module?.id === moduleId &&
    !resolved?.topic
  );
}

export function moduleRowIsLockedOpen(resolved, subjectSlug, moduleId) {
  return Boolean(
    resolved?.topic &&
      resolved?.subject?.slug === subjectSlug &&
      resolved?.module?.id === moduleId,
  );
}

export function semesterRowIsExpanded(resolved, semesterId, storedExpanded) {
  return treeRowIsExpanded({
    stored: storedExpanded,
    onRouteAncestry: resolved?.semester === semesterId,
  });
}

export function subjectRowIsExpanded(resolved, subjectSlug, storedExpanded) {
  return treeRowIsExpanded({
    stored: storedExpanded,
    onRouteAncestry: resolved?.subject?.slug === subjectSlug,
  });
}

export function moduleRowIsExpanded(resolved, subjectSlug, moduleId, storedExpanded) {
  const onRouteAncestry =
    resolved?.subject?.slug === subjectSlug && resolved?.module?.id === moduleId;
  return treeRowIsExpanded({
    stored: storedExpanded,
    onRouteAncestry,
    lockOpenBecauseActiveTopic: moduleRowIsLockedOpen(resolved, subjectSlug, moduleId),
  });
}

export function topicRowIsActive(resolved, subjectSlug, moduleId, topicId) {
  return (
    resolved?.subject?.slug === subjectSlug &&
    resolved?.module?.id === moduleId &&
    resolved?.topic?.id === topicId
  );
}
