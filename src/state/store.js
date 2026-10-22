const listeners = new Set();

export const store = {
  curriculum: null,
  searchIndex: null,
  searchIndexReady: false,
  searchIndexError: null,
  programme: 'llb-3yr',
  route: null,
  pendingNavigation: null,
  sidebarExpanded: loadJson('mu-law-sidebar', {}),
  theme: localStorage.getItem('mu-law-theme') || 'light',
};

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  for (const fn of listeners) fn(store);
}

export function setStore(partial) {
  Object.assign(store, partial);
  emit();
}

export function setProgramme(id) {
  store.programme = id;
  localStorage.setItem('mu-law-programme', id);
  emit();
}

export function setTheme(mode) {
  store.theme = mode;
  localStorage.setItem('mu-law-theme', mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode } }));
}

export function initTheme() {
  const saved = localStorage.getItem('mu-law-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = saved || (prefersDark ? 'dark' : 'light');
  setTheme(mode);
}

export function saveSidebarState(key, value) {
  store.sidebarExpanded[key] = value;
  localStorage.setItem('mu-law-sidebar', JSON.stringify(store.sidebarExpanded));
  emit();
}

/** Expand sidebar tree for search navigation without triggering a full re-render race. */
export function expandSidebarForIntent(intent) {
  if (!intent) return;
  const { programmeId, semesterId, subjectSlug, moduleId } = intent;
  if (programmeId && semesterId) {
    store.sidebarExpanded[`${programmeId}:${semesterId}`] = true;
  }
  if (programmeId && semesterId && subjectSlug) {
    store.sidebarExpanded[`${programmeId}:${semesterId}:${subjectSlug}`] = true;
  }
  if (programmeId && semesterId && subjectSlug && moduleId) {
    store.sidebarExpanded[`${programmeId}:${semesterId}:${subjectSlug}:${moduleId}`] = true;
  }
  localStorage.setItem('mu-law-sidebar', JSON.stringify(store.sidebarExpanded));
}

/** Open sidebar keys on the current route only where the user has not set a preference. */
export function ensureSidebarPathOpen(resolved) {
  if (!resolved?.semester) return false;
  const programme = resolved.programme || store.programme;
  const keys = [`${programme}:${resolved.semester}`];
  const subjectSlug = resolved.subject?.slug;
  if (subjectSlug) {
    keys.push(`${programme}:${resolved.semester}:${subjectSlug}`);
    if (resolved.module?.id) {
      keys.push(`${programme}:${resolved.semester}:${subjectSlug}:${resolved.module.id}`);
    }
  }
  let changed = false;
  for (const key of keys) {
    if (store.sidebarExpanded[key] === undefined) {
      store.sidebarExpanded[key] = true;
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem('mu-law-sidebar', JSON.stringify(store.sidebarExpanded));
  }
  return changed;
}

export const SIDEBAR_ACCORDION_SUBJECTS = true;

/** Collapse sibling subjects in the same semester (navigate only). */
export function collapseSiblingSubjects(programme, semester, activeSubjectSlug) {
  if (!SIDEBAR_ACCORDION_SUBJECTS || !store.curriculum || !semester || !activeSubjectSlug) return;
  const prog = store.curriculum.programmes.find((p) => p.id === programme);
  const slugs = prog?.subjectsBySemester?.[semester] || [];
  let changed = false;
  for (const slug of slugs) {
    if (slug === activeSubjectSlug) continue;
    const key = `${programme}:${semester}:${slug}`;
    if (store.sidebarExpanded[key] !== false) {
      store.sidebarExpanded[key] = false;
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem('mu-law-sidebar', JSON.stringify(store.sidebarExpanded));
  }
}

export function clearPendingNavigation() {
  store.pendingNavigation = null;
}
