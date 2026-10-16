const listeners = new Set();

export const store = {
  curriculum: null,
  searchIndex: null,
  programme: 'llb-3yr',
  route: null,
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
  emit();
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
