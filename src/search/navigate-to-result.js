import { store, subscribe, expandSidebarForIntent, clearPendingNavigation } from '../state/store.js';
import { onRouteChange } from '../router/hash-router.js';
import { focusTopicElement } from '../utils/focus-scroll.js';
import { buildNavigationTarget } from './navigation-target.js';

const MAX_WAIT_MS = 2500;

function routeMatchesTarget(resolved, target) {
  if (!resolved || !target) return false;

  if (target.recordType === 'topic' || target.recordType === 'case' || target.recordType === 'statute') {
    return (
      resolved.view === 'topic' &&
      resolved.topic?.id === target.topicId &&
      resolved.module?.id === target.moduleId &&
      resolved.subject?.slug === target.subjectSlug
    );
  }

  if (target.recordType === 'module') {
    return resolved.subject?.slug === target.subjectSlug && resolved.module?.id === target.moduleId;
  }

  if (target.recordType === 'reading' || target.recordType === 'subject') {
    return resolved.subject?.slug === target.subjectSlug;
  }

  return false;
}

function applyFocusForTarget(target) {
  if (!target) return;

  if (target.recordType === 'topic' || target.recordType === 'case' || target.recordType === 'statute') {
    if (target.topicId) focusTopicElement(target.topicId);
    return;
  }

  if (target.recordType === 'module' && target.moduleId) {
    const modEl = document.getElementById(target.moduleId);
    modEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    modEl?.classList.add('topic-highlight');
    window.setTimeout(() => modEl?.classList.remove('topic-highlight'), 2000);
    return;
  }

  if (target.recordType === 'reading' && target.readingAnchorId) {
    const readEl = document.getElementById(target.readingAnchorId);
    readEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    readEl?.classList.add('topic-highlight');
    window.setTimeout(() => readEl?.classList.remove('topic-highlight'), 2000);
  }
}

function waitForNavigationTarget(target, onReady) {
  if (routeMatchesTarget(store.route, target)) {
    onReady();
    return () => {};
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onReady();
    unsub();
    window.clearTimeout(timer);
  };

  const unsub = subscribe(() => {
    if (routeMatchesTarget(store.route, target)) finish();
  });

  const timer = window.setTimeout(() => {
    if (routeMatchesTarget(store.route, target)) finish();
  }, MAX_WAIT_MS);

  return finish;
}

/**
 * Navigate from a search result using stable record metadata.
 */
export function navigateToSearchResult(record, options = {}) {
  const target = buildNavigationTarget(
    record,
    options.preferredProgrammeId || store.programme,
    options.filterProgrammeId || '',
  );

  if (!target) {
    console.warn('[search] No navigable destination for record', record?.id, record?.recordType);
    return false;
  }

  store.pendingNavigation = target;
  expandSidebarForIntent(target);

  const hashBody = target.hash.replace(/^#/, '');
  const hashFull = `#${hashBody}`;

  waitForNavigationTarget(target, () => {
    applyFocusForTarget(target);
    clearPendingNavigation();
  });

  if (location.hash !== hashFull) {
    location.hash = hashBody;
  } else {
    onRouteChange();
  }

  return true;
}

export function applyPendingNavigationIfReady() {
  const target = store.pendingNavigation;
  if (!target) return;
  if (!routeMatchesTarget(store.route, target)) return;
  applyFocusForTarget(target);
  clearPendingNavigation();
}
