import { el, clear, formatSemesterLabel } from '../utils/dom.js';
import { store, subscribe, setTheme } from '../state/store.js';
import { renderProgrammeSwitcher } from './programme-switcher.js';
import { renderSidebarTree } from './sidebar-tree.js';
import { renderBreadcrumbs } from './breadcrumbs.js';
import { renderSubjectView } from './subject-view.js';
import { renderTopicDrawer } from './topic-drawer.js';
import { navigate } from '../router/hash-router.js';
import { focusTopicElement } from '../utils/focus-scroll.js';
import { openSearchHint } from '../search/command-palette.js';
import { applyPendingNavigationIfReady } from '../search/navigate-to-result.js';

let appRoot = null;
let mainEl = null;
let sidebarSlot = null;

export function mountShell(root) {
  appRoot = root;
  subscribe(render);
  render();
}

function render() {
  if (!appRoot || !store.curriculum) return;
  document.querySelectorAll('.topic-drawer-overlay').forEach((n) => n.remove());
  clear(appRoot);

  const header = el('header', { className: 'sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur no-print' }, [
    el('div', { className: 'max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between' }, [
      el('div', { className: 'flex items-center gap-3 flex-wrap' }, [
        el('a', { href: `#/${store.programme}`, className: 'font-serif font-bold text-lg text-indigo-700 dark:text-indigo-400' }, ['MU Law Portal']),
        renderProgrammeSwitcher(),
      ]),
      el('div', { className: 'flex items-center gap-2' }, [
        el('button', {
          type: 'button',
          className: 'text-xs px-3 py-1.5 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800',
          onClick: openSearchHint,
        }, ['Search ⌘K']),
        el('button', {
          type: 'button',
          className: 'text-xs px-3 py-1.5 rounded-lg border dark:border-slate-600',
          onClick: () => setTheme(store.theme === 'dark' ? 'light' : 'dark'),
        }, [store.theme === 'dark' ? 'Light' : 'Dark']),
        el('button', {
          type: 'button',
          className: 'text-xs px-3 py-1.5 rounded-lg border dark:border-slate-600',
          onClick: () => window.print(),
        }, ['Print']),
      ]),
    ]),
  ]);

  const layout = el('div', { className: 'max-w-[1600px] mx-auto flex min-h-[calc(100vh-57px)]' });
  sidebarSlot = el('aside', { className: 'no-print w-72 shrink-0 hidden lg:block border-r dark:border-slate-800 p-3 overflow-y-auto max-h-[calc(100vh-57px)] sticky top-[57px]' });
  sidebarSlot.appendChild(renderSidebarTree(store.route));

  mainEl = el('main', { id: 'main-content', className: 'flex-1 p-4 md:p-6 min-w-0' });
  layout.appendChild(sidebarSlot);
  layout.appendChild(mainEl);

  appRoot.appendChild(header);
  appRoot.appendChild(layout);

  renderMain();

  appRoot.appendChild(
    el('footer', { className: 'border-t dark:border-slate-800 py-4 text-center text-xs text-slate-500 px-4' }, [
      'Educational resource based on University of Mumbai CBCS syllabus (2022–23). Verify current law and your batch syllabus before exams.',
    ]),
  );
}

function renderMain() {
  clear(mainEl);
  const resolved = store.route;
  if (!resolved) return;

  if (resolved.view === 'home') {
    mainEl.appendChild(renderHome(resolved.programme));
    return;
  }

  if (resolved.view === 'semester') {
    mainEl.appendChild(renderSemester(resolved));
    return;
  }

  if (resolved.view === 'notFound') {
    mainEl.appendChild(
      el('div', { className: 'rounded-xl border p-8 text-center' }, [
        el('h1', { className: 'text-xl font-bold mb-2' }, ['Page not found']),
        el('p', { className: 'text-sm opacity-70 mb-4' }, ['This syllabus link may be outdated. Try search (⌘K).']),
        el('button', { type: 'button', className: 'text-indigo-600 underline', onClick: openSearchHint }, ['Open search']),
      ]),
    );
    return;
  }

  if (resolved.subject) {
    mainEl.appendChild(renderBreadcrumbs(resolved));
    mainEl.appendChild(renderSubjectView(resolved));
  }

  if (resolved.view === 'topic' && resolved.topic) {
    document.body.appendChild(
      renderTopicDrawer(resolved, () => {
        if (sidebarSlot) {
          clear(sidebarSlot);
          sidebarSlot.appendChild(renderSidebarTree(store.route));
        }
      }),
    );
  }

  requestAnimationFrame(() => {
    applyPendingNavigationIfReady();
    if (!store.pendingNavigation && resolved.view === 'topic' && resolved.topic) {
      focusTopicElement(resolved.topic.id);
    }
  });
}

function renderHome(programme) {
  const prog = store.curriculum.programmes.find((p) => p.id === programme);
  const box = el('div', { className: 'max-w-2xl' }, [
    el('h1', { className: 'font-serif text-3xl font-bold mb-2' }, ['Digital Study Book']),
    el('p', { className: 'text-slate-600 dark:text-slate-400 mb-6' }, [
      'Color-coded, deep-linkable syllabus for University of Mumbai LL.B. programmes. Pick a semester to begin.',
    ]),
  ]);

  const grid = el('div', { className: 'grid sm:grid-cols-2 gap-3' });
  for (const sem of prog.semesters) {
    const count = (prog.subjectsBySemester[sem] || []).length;
    grid.appendChild(
      el('button', {
        type: 'button',
        className: 'text-left p-4 rounded-xl border dark:border-slate-700 hover:border-indigo-400 hover:shadow-md transition-all',
        onClick: () => navigate({ programme, semester: sem, subject: null, module: null, topic: null }),
      }, [
        el('div', { className: 'font-semibold' }, [formatSemesterLabel(sem)]),
        el('div', { className: 'text-xs opacity-60 mt-1' }, [`${count} subjects`]),
      ]),
    );
  }
  box.appendChild(grid);
  return box;
}

function renderSemester({ programme, semester, subjects }) {
  const box = el('div', {});
  box.appendChild(el('h1', { className: 'font-serif text-2xl font-bold mb-4' }, [formatSemesterLabel(semester)]));

  const list = el('ul', { className: 'space-y-2' });
  for (const slug of subjects) {
    const s = store.curriculum.subjects[slug];
    if (!s) continue;
    const hue = s.theme?.hue ?? 220;
    list.appendChild(
      el('li', {}, [
        el('button', {
          type: 'button',
          className: 'w-full text-left p-4 rounded-xl border dark:border-slate-700 hover:shadow-md transition-shadow',
          style: `border-left: 4px solid hsl(${hue} 55% 45%)`,
          onClick: () => navigate({ programme, semester, subject: slug, module: null, topic: null }),
        }, [
          el('span', { className: 'font-medium' }, [s.title]),
          s.isElective ? el('span', { className: 'ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded' }, ['Elective']) : null,
        ]),
      ]),
    );
  }
  box.appendChild(list);
  return box;
}
