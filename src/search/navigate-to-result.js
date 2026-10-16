import { setProgramme, saveSidebarState, store, subscribe } from '../state/store.js';
import { focusTopicElement } from '../utils/focus-scroll.js';

/**
 * Navigate from a search result with programme-aware route and sidebar expansion.
 */
export function navigateToSearchResult(result) {
  const route = result.route;
  if (!route?.path) return;

  const path = route.path.replace(/^#/, '');
  const programmeId = route.programmeId;
  const semesterId = route.semesterId;
  const subjectSlug = route.subjectSlug;
  const moduleId = route.moduleId;
  const topicId = route.topicId;

  if (programmeId) setProgramme(programmeId);

  if (programmeId && semesterId) {
    saveSidebarState(`${programmeId}:${semesterId}`, true);
  }
  if (programmeId && semesterId && subjectSlug) {
    saveSidebarState(`${programmeId}:${semesterId}:${subjectSlug}`, true);
  }
  if (programmeId && semesterId && subjectSlug && moduleId) {
    saveSidebarState(`${programmeId}:${semesterId}:${subjectSlug}:${moduleId}`, true);
  }

  const hashTarget = path.startsWith('/') ? path : `/${path}`;

  let unsub = null;
  const timeout = window.setTimeout(() => {
    if (topicId) focusTopicElement(topicId);
    if (unsub) unsub();
  }, 800);

  unsub = subscribe(() => {
    const r = store.route;
    if (!r) return;
    if (topicId && r.topic?.id === topicId) {
      window.clearTimeout(timeout);
      requestAnimationFrame(() => focusTopicElement(topicId));
      unsub();
      unsub = null;
    } else if (!topicId && r.subject?.slug === subjectSlug) {
      window.clearTimeout(timeout);
      unsub();
      unsub = null;
    }
  });

  if (location.hash !== `#${hashTarget}`) {
    location.hash = hashTarget;
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
