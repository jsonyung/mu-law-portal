import { setStore, store } from '../state/store.js';

const ROUTE_RE =
  /^\/(?<programme>llb-3yr|llb-5yr)(?:\/(?<semester>sem-\d+))?(?:\/(?<subject>[^/]+))?(?:\/(?<module>module-\d+))?(?:\/(?<topic>[^/]+))?$/;

export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw) return { programme: store.programme || 'llb-3yr' };
  const m = `/${raw}`.match(ROUTE_RE);
  if (!m?.groups) return { invalid: true };
  return { ...m.groups };
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
  if (!curriculum || route.invalid) return { view: 'notFound', route };

  const programme = route.programme || store.programme;
  if (route.programme) setStore({ programme });

  if (!route.semester) {
    return { view: 'home', programme, route: { programme } };
  }

  const prog = curriculum.programmes.find((p) => p.id === programme);
  const semSubjects = prog?.subjectsBySemester?.[route.semester] || [];

  if (!route.subject) {
    return { view: 'semester', programme, semester: route.semester, subjects: semSubjects, route };
  }

  const subject = curriculum.subjects[route.subject];
  if (!subject) return { view: 'notFound', route };

  if (!route.module) {
    return { view: 'subject', programme, semester: route.semester, subject, route };
  }

  const mod = subject.modules.find((m) => m.id === route.module);
  if (!mod) return { view: 'notFound', route };

  if (!route.topic) {
    return { view: 'module', programme, semester: route.semester, subject, module: mod, route };
  }

  const topic = mod.topics.find((t) => t.id === route.topic);
  if (!topic) return { view: 'notFound', route };

  return {
    view: 'topic',
    programme,
    semester: route.semester,
    subject,
    module: mod,
    topic,
    route,
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
  const path = buildPath(next);
  const hash = path.startsWith('#') ? path : `#${path}`;
  if (location.hash !== hash) location.hash = hash.slice(1);
  else onRouteChange();
}

export function onRouteChange() {
  const route = parseHash();
  const resolved = resolveRoute(route, store.curriculum);
  setStore({ route: resolved });

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
