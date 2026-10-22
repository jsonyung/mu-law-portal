import { el, clear, formatSemesterLabel, programmeShortLabel } from '../utils/dom.js';
import { store, subscribe, setTheme } from '../state/store.js';
import { renderProgrammeSwitcher } from './programme-switcher.js';
import { renderSidebarTree } from './sidebar-tree.js';
import { renderBreadcrumbs } from './breadcrumbs.js';
import { renderSubjectView } from './subject-view.js';
import { renderTopicStudyView } from './topic-study-view.js';
import { renderHome } from './home-view.js';
import { renderFooter } from './footer.js';
import { navigate } from '../router/hash-router.js';
import { focusTopicElement, scrollToPageAnchor } from '../utils/focus-scroll.js';
import { openSearchHint } from '../search/command-palette.js';
import { applyPendingNavigationIfReady } from '../search/navigate-to-result.js';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scroll-lock.js';
import { iconSearch, iconMenu, iconClose } from './icons.js';

let appRoot = null;
let mainEl = null;
let desktopSidebarSlot = null;
let mobileNavOpen = false;
let lastRouteSnapshot = null;
let scrollLockActive = false;
let menuButtonEl = null;
let escapeBound = false;

export function mountShell(root) {
  appRoot = root;
  if (!escapeBound) {
    document.addEventListener('keydown', onDocumentKeydown);
    document.addEventListener('close-mobile-nav-request', closeMobileNav);
    document.addEventListener('theme-changed', onThemeChanged);
    escapeBound = true;
  }
  subscribe(render);
  render();
}

function onThemeChanged() {
  document.querySelectorAll('.app-header .btn-icon[aria-label*="theme"]').forEach((btn) => {
    btn.setAttribute(
      'aria-label',
      store.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
    );
    btn.textContent = store.theme === 'dark' ? '☀' : '☾';
  });
}

function isSearchPaletteOpen() {
  const palette = document.getElementById('command-palette');
  return Boolean(palette && !palette.classList.contains('hidden'));
}

function onDocumentKeydown(e) {
  if (e.key === 'Escape' && mobileNavOpen && !isSearchPaletteOpen()) {
    e.preventDefault();
    closeMobileNav();
  }
}

function closeMobileNav() {
  mobileNavOpen = false;
  render();
  requestAnimationFrame(() => menuButtonEl?.focus());
}

function openMobileNav() {
  document.dispatchEvent(new CustomEvent('close-search-palette-request'));
  mobileNavOpen = true;
  render();
  requestAnimationFrame(() => {
    const closeBtn = document.getElementById('mobile-nav-close');
    closeBtn?.focus();
  });
}

function shouldCloseNavOnRouteChange(prev, next) {
  if (!prev || !next) return false;
  const progSwitchOnHome =
    prev.view === 'home' && next.view === 'home' && prev.programme !== next.programme;
  if (progSwitchOnHome) return false;
  return (
    prev.view !== next.view ||
    prev.programme !== next.programme ||
    prev.semester !== next.semester ||
    prev.subject?.slug !== next.subject?.slug ||
    prev.module?.id !== next.module?.id ||
    prev.topic?.id !== next.topic?.id
  );
}

function routeSnapshot(route) {
  if (!route) return null;
  return {
    view: route.view,
    programme: route.programme,
    semester: route.semester,
    subject: route.subject ? { slug: route.subject.slug } : null,
    module: route.module ? { id: route.module.id } : null,
    topic: route.topic ? { id: route.topic.id } : null,
  };
}

function syncScrollLock() {
  if (mobileNavOpen && !scrollLockActive) {
    lockBodyScroll();
    scrollLockActive = true;
  } else if (!mobileNavOpen && scrollLockActive) {
    unlockBodyScroll();
    scrollLockActive = false;
  }
}

function scrollSidebarActiveTopicIntoView() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opts = { block: 'nearest', behavior: reduced ? 'auto' : 'smooth' };
  document.querySelector('.sidebar-panel .tree-topic.is-active')?.scrollIntoView(opts);
  document.querySelector('#mobile-nav-scroll .tree-topic.is-active')?.scrollIntoView(opts);
}

function render() {
  if (!appRoot || !store.curriculum) return;

  const sidebarScrollElBefore = document.querySelector('.sidebar-panel');
  const sidebarScrollTopBefore = sidebarScrollElBefore?.scrollTop ?? null;
  const mobileScrollElBefore = document.getElementById('mobile-nav-scroll');
  const mobileScrollTopBefore = mobileScrollElBefore?.scrollTop ?? null;

  const resolved = store.route;
  const prevRouteSnapshot = lastRouteSnapshot;
  const routeChanged = shouldCloseNavOnRouteChange(prevRouteSnapshot, routeSnapshot(resolved));
  if (mobileNavOpen && routeChanged) {
    mobileNavOpen = false;
  }
  lastRouteSnapshot = routeSnapshot(resolved);

  clear(appRoot);

  const header = renderHeader();
  const footerVariant = resolved?.view === 'home' ? 'full' : 'compact';
  const footer = renderFooter({ variant: footerVariant });

  const prog = store.curriculum.programmes.find((p) => p.id === store.programme);

  const mobileBackdrop = el('button', {
    type: 'button',
    className: `mobile-nav-backdrop lg:hidden fixed inset-0 ${
      mobileNavOpen ? 'mobile-nav-backdrop--open' : ''
    }`,
    'aria-label': 'Close navigation menu',
    tabindex: mobileNavOpen ? '0' : '-1',
    onClick: closeMobileNav,
  });

  const mobileSidebar = el('aside', {
    id: 'sidebar-panel',
    className: `mobile-nav-drawer lg:hidden fixed flex flex-col overflow-hidden
      ${mobileNavOpen ? 'mobile-nav-drawer--open' : 'mobile-nav-drawer--closed'}`,
    role: 'dialog',
    'aria-modal': mobileNavOpen ? 'true' : 'false',
    'aria-label': 'Curriculum navigation',
    'aria-hidden': mobileNavOpen ? 'false' : 'true',
  });

  mobileSidebar.appendChild(
    el('header', {
      className: 'mobile-nav-drawer-top shrink-0 flex-none border-b',
      style: 'border-color: hsl(var(--border-subtle))',
    }, [
      el('div', {
        className: 'flex items-start justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3',
      }, [
        el('div', { className: 'min-w-0 flex-1' }, [
          el('p', {
            className: 'font-serif font-bold text-lg tracking-tight text-brand-navy dark:text-slate-50',
          }, ['MU Law Portal']),
          el('p', {
            className: 'text-[10px] font-semibold uppercase tracking-wider mt-1',
            style: 'color: hsl(var(--text-muted))',
          }, ['Curriculum']),
        ]),
        el('button', {
          type: 'button',
          id: 'mobile-nav-close',
          className: 'btn-search-trigger shrink-0',
          'aria-label': 'Close menu',
          onClick: closeMobileNav,
        }, [iconClose()]),
      ]),
    ]),
  );

  mobileSidebar.appendChild(
    el('div', {
      className: 'mobile-nav-drawer-programme shrink-0 flex-none border-b px-4 py-3 flex flex-col gap-2',
      style: 'border-color: hsl(var(--border-subtle))',
    }, [
      renderProgrammeSwitcher({ variant: 'drawer' }),
      prog
        ? el('p', {
            id: 'mobile-programme-semester-count',
            className: 'text-xs font-medium tabular-nums',
            style: 'color: hsl(var(--text-muted))',
          }, [`${prog.semesters.length} semesters`])
        : null,
      prog
        ? el('p', {
            className: 'text-[11px] leading-snug',
            style: 'color: hsl(var(--text-secondary))',
            'aria-live': 'polite',
          }, [programmeShortLabel(prog.id)])
        : null,
    ]),
  );

  const mobileNavScroll = el('div', {
    id: 'mobile-nav-scroll',
    className: 'mobile-nav-drawer-tree flex-1 flex-auto min-h-0 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]',
  });
  mobileNavScroll.appendChild(renderSidebarTree(store.route, { hideHeading: true, mobile: true }));
  if (!routeChanged && mobileScrollElBefore && mobileScrollTopBefore != null) {
    mobileNavScroll.scrollTop = mobileScrollTopBefore;
  }
  mobileSidebar.appendChild(mobileNavScroll);

  desktopSidebarSlot = el('aside', {
    className: 'hidden lg:block lg:w-72 lg:shrink-0 sidebar-panel sticky top-[var(--header-h)] max-h-[calc(100vh-var(--header-h))] overflow-y-auto',
    'aria-label': 'Curriculum navigation',
  });
  desktopSidebarSlot.appendChild(renderSidebarTree(store.route));

  if (!routeChanged && sidebarScrollElBefore && sidebarScrollTopBefore != null) {
    desktopSidebarSlot.scrollTop = sidebarScrollTopBefore;
  }

  mainEl = el('main', {
    id: 'main-content',
    className: 'flex-1 min-w-0 w-full max-w-full p-4 sm:p-6 lg:p-8',
  });

  const bodyRow = el('div', {
    className: 'app-body flex w-full min-w-0 max-w-content mx-auto flex-1 lg:flex-row',
  });
  bodyRow.appendChild(desktopSidebarSlot);
  bodyRow.appendChild(mainEl);

  const page = el('div', {
    className: 'min-h-screen min-h-[100dvh] flex flex-col overflow-x-hidden w-full',
  });
  page.appendChild(header);
  page.appendChild(bodyRow);
  page.appendChild(footer);

  if (mobileNavOpen) {
    page.inert = true;
    page.setAttribute('aria-hidden', 'true');
  }

  appRoot.appendChild(page);
  appRoot.appendChild(mobileBackdrop);
  appRoot.appendChild(mobileSidebar);

  renderMain();

  syncScrollLock();

  requestAnimationFrame(() => {
    syncHeaderHeight();
    if (routeChanged) {
      scrollSidebarActiveTopicIntoView();
    }
  });
}

function syncHeaderHeight() {
  const headerEl = document.querySelector('.app-header');
  if (!headerEl) return;
  const h = Math.ceil(headerEl.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--header-h', `${h}px`);
}

function renderHeader() {
  const prog = store.curriculum.programmes.find((p) => p.id === store.programme);
  const syllabusYear = store.curriculum.meta?.syllabusYear;

  return el('header', { className: 'app-header', role: 'banner' }, [
    el('div', { className: 'max-w-content mx-auto px-4 py-2 lg:py-3 w-full min-w-0' }, [
      el('div', { className: 'flex items-center gap-2 justify-between min-w-0' }, [
        el('div', { className: 'flex items-center gap-2 min-w-0 flex-1' }, [
          (menuButtonEl = el('button', {
            type: 'button',
            id: 'mobile-nav-open',
            className: 'btn-menu-trigger lg:hidden shrink-0',
            'aria-expanded': mobileNavOpen ? 'true' : 'false',
            'aria-controls': 'sidebar-panel',
            onClick: () => {
              if (mobileNavOpen) closeMobileNav();
              else openMobileNav();
            },
          }, [iconMenu()])),
          el('div', { className: 'min-w-0 flex-1' }, [
            el('a', {
              href: `#/${store.programme}`,
              className: 'font-serif font-bold text-base sm:text-lg md:text-xl tracking-tight block truncate text-brand-navy dark:text-slate-50',
            }, ['MU Law Portal']),
            el('p', {
              className: 'hidden xl:block text-[11px] leading-snug truncate max-w-md mt-0.5',
              style: 'color: hsl(var(--text-muted))',
            }, [
              'UoM LL.B. syllabus · Independent resource',
              syllabusYear ? ` · ${syllabusYear}` : '',
            ]),
          ]),
        ]),
        el('div', { className: 'flex items-center gap-1 shrink-0' }, [
          el('button', {
            type: 'button',
            className: 'btn-search-wide hidden sm:inline-flex xl:inline-flex',
            onClick: openSearchHint,
            'aria-keyshortcuts': 'Meta+K Control+K',
            'aria-label': 'Search curriculum',
          }, [
            iconSearch(),
            el('span', { className: 'hidden md:inline text-sm font-medium' }, ['Search']),
            el('span', { className: 'search-kbd' }, ['⌘K']),
          ]),
          el('button', {
            type: 'button',
            className: 'btn-search-trigger sm:hidden shrink-0',
            'aria-label': 'Search curriculum',
            onClick: openSearchHint,
          }, [iconSearch()]),
          el('button', {
            type: 'button',
            className: 'btn-icon min-h-11 min-w-11',
            'aria-label': store.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
            onClick: () => setTheme(store.theme === 'dark' ? 'light' : 'dark'),
          }, [store.theme === 'dark' ? '☀' : '☾']),
          el('button', {
            type: 'button',
            className: 'btn-icon min-h-11 min-w-11 hidden sm:inline-flex',
            'aria-label': 'Print page',
            onClick: () => window.print(),
          }, ['⎙']),
        ]),
      ]),
      el('div', {
        className: 'header-row-programme hidden xl:flex items-center gap-3 min-w-0 w-full border-t mt-2 pt-2 lg:mt-2.5',
      }, [
        el('div', { className: 'flex-1 min-w-0' }, [renderProgrammeSwitcher()]),
        prog
          ? el('p', {
              className: 'text-xs font-medium tabular-nums shrink-0 whitespace-nowrap px-2 py-1 rounded-md',
              style: 'color: hsl(var(--text-muted)); background: hsl(var(--surface-muted))',
            }, [`${prog.semesters.length} sem.`])
          : null,
      ]),
    ]),
  ]);
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
      el('div', { className: 'study-card max-w-lg mx-auto text-center py-12 w-full' }, [
        el('h1', { className: 'font-serif text-xl font-bold mb-2' }, ['Page not found']),
        el('p', { className: 'text-sm mb-6', style: 'color: hsl(var(--text-secondary))' }, [
          'This syllabus link may be outdated or mistyped. Try global search.',
        ]),
        el('button', { type: 'button', className: 'btn-primary-soft min-h-11', onClick: openSearchHint }, [
          'Open search ⌘K',
        ]),
      ]),
    );
    return;
  }

  if (resolved.view === 'topic' && resolved.topic) {
    mainEl.appendChild(renderBreadcrumbs(resolved));
    mainEl.appendChild(renderTopicStudyView(resolved));
  } else if (resolved.subject) {
    mainEl.appendChild(renderBreadcrumbs(resolved));
    mainEl.appendChild(renderSubjectView(resolved));
  }

  requestAnimationFrame(() => {
    applyPendingNavigationIfReady();
    if (!store.pendingNavigation && resolved.view === 'topic' && resolved.topic) {
      focusTopicElement(resolved.topic.id);
    }
    if (!store.pendingNavigation && resolved.routeAnchor) {
      scrollToPageAnchor(resolved.routeAnchor);
    }
  });
}

function renderSemester({ programme, semester, subjects }) {
  const box = el('div', { className: 'w-full min-w-0 max-w-3xl space-y-6' });
  box.appendChild(
    el('header', { className: 'space-y-1' }, [
      el('p', { className: 'text-xs font-semibold uppercase tracking-wider', style: 'color: hsl(var(--text-muted))' }, [
        'Subjects',
      ]),
      el('h1', { className: 'font-serif text-2xl md:text-3xl font-bold break-words' }, [
        formatSemesterLabel(semester),
      ]),
    ]),
  );

  const list = el('ul', { className: 'space-y-3' });
  for (const slug of subjects) {
    const s = store.curriculum.subjects[slug];
    if (!s) continue;
    const hue = s.theme?.hue ?? 220;
    list.appendChild(
      el('li', {}, [
        el('button', {
          type: 'button',
          className: 'semester-card w-full min-h-11 text-left',
          style: `border-left: 4px solid hsl(${hue} 55% 45%)`,
          onClick: () => navigate({ programme, semester, subject: slug, module: null, topic: null }),
        }, [
          el('span', { className: 'font-medium text-base break-words' }, [s.title]),
          s.isElective
            ? el('span', {
                className: 'ml-2 text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5',
                style: 'background: hsl(38 92% 90%); color: hsl(32 80% 30%)',
              }, ['Elective'])
            : null,
        ]),
      ]),
    );
  }
  box.appendChild(list);
  return box;
}
