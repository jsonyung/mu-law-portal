import {
  setStore,
  store,
  ensureSidebarPathOpen,
  collapseSiblingSubjects,
} from '../state/store.js';
import { parseHashRoute } from './hash-route-string.js';

export function parseHash(hash = location.hash) {
  const parsed = parseHashRoute(hash);
  if (parsed.empty) {
    return { programme: store.programme || 'llb-3yr', routeAnchor: parsed.routeAnchor };
  }
  if (parsed.invalid) {
    return { invalid: true, routeAnchor: parsed.routeAnchor };
  }
  const { routeAnchor, ...groups } = parsed;
  return { ...groups, routeAnchor };
}

export function buildPath({ programme, semester, subject, module, topic }) {
  let p = `#/${programme || store.programme}`;
  if (semester) p += `/${semester}`;
  if (subject) p += `/${subject}`;
  if (module) p += `/${module}`;
  if (topic) p += `/${topic}`;
  return p;
}

export function resolveRoute(route, curriculum) {
  const routeAnchor = route.routeAnchor || null;
  if (!curriculum || route.invalid) return { view: 'notFound', route, routeAnchor };

  const programme = route.programme || store.programme;

  if (!route.semester) {
    return { view: 'home', programme, route: { programme }, routeAnchor };
  }

  const prog = curriculum.programmes.find((p) => p.id === programme);
  const semSubjects = prog?.subjectsBySemester?.[route.semester] || [];

  if (!route.subject) {
    return { view: 'semester', programme, semester: route.semester, subjects: semSubjects, route, routeAnchor };
  }

  const subject = curriculum.subjects[route.subject];
  if (!subject) return { view: 'notFound', route, routeAnchor };

  if (!route.module) {
    return { view: 'subject', programme, semester: route.semester, subject, route, routeAnchor };
  }

  const mod = subject.modules.find((m) => m.id === route.module);
  if (!mod) return { view: 'notFound', route, routeAnchor };

  if (!route.topic) {
    return {
      view: 'module',
      programme,
      semester: route.semester,
      subject,
      module: mod,
      route,
      routeAnchor,
    };
  }

  const topic = mod.topics.find((t) => t.id === route.topic);
  if (!topic) return { view: 'notFound', route, routeAnchor };

  return {
    view: 'topic',
    programme,
    semester: route.semester,
    subject,
    module: mod,
    topic,
    route,
    routeAnchor,
  };
}

export function navigate(partial) {
  const current = parseHash();
  const next = {
    programme: partial.programme ?? current.programme ?? store.programme,
    semester: 'semester' in partial ? partial.semester : current.semester,
    subject: 'subject' in partial ? partial.subject : current.subject,
    module: 'module' in partial ? partial.module : current.module,
    topic: 'topic' in partial ? partial.topic : current.topic,
  };
  if ('subject' in partial && partial.subject && next.semester) {
    collapseSiblingSubjects(next.programme, next.semester, partial.subject);
  }

  const path = buildPath(next);
  const hash = path.startsWith('#') ? path : `#${path}`;
  if (location.hash !== hash) location.hash = hash.slice(1);
  else onRouteChange();
}

export function onRouteChange() {
  const route = parseHash();
  const resolved = resolveRoute(route, store.curriculum);
  const programme = resolved.programme || route.programme || store.programme;
  if (programme && programme !== store.programme) {
    store.programme = programme;
    localStorage.setItem('mu-law-programme', programme);
  }
  ensureSidebarPathOpen(resolved);
  setStore({ route: resolved, programme });

  if (!location.hash || location.hash === '#') {
    const last = localStorage.getItem('mu-law-last-route');
    if (last && last.startsWith('#/')) {
      location.hash = last.slice(1);
      return;
    }
  } else {
    localStorage.setItem('mu-law-last-route', location.hash);
  }
}

export function initRouter() {
  window.addEventListener('hashchange', onRouteChange);
  onRouteChange();
}
