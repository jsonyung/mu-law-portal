import { el, clear } from '../utils/dom.js';
import { store } from '../state/store.js';
import {
  search,
  isSearchReady,
  getInitError,
  formatBreadcrumb,
  excerptWithSafeHighlight,
} from './search-service.js';
import { navigateToSearchResult } from './navigate-to-result.js';
import { iconSearch } from '../ui/icons.js';

let open = false;
let selected = 0;
let query = '';
let results = [];
let matchedAliases = [];
let debounceTimer = null;
let paletteEl = null;
let listEl = null;
let inputEl = null;
let filterProgramme = '';
let filterSemester = '';
let filterType = '';
let lastTrigger = null;

export function initCommandPalette() {
  document.addEventListener('search-index-ready', () => {
    if (open) runSearch();
  });
  document.addEventListener('close-search-palette-request', () => togglePalette(false));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette(true);
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      togglePalette(false);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(selected + 1, results.length - 1);
      renderResults();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
      renderResults();
    }
    if (e.key === 'Enter' && results[selected]) {
      e.preventDefault();
      go(results[selected]);
    }
  });
}

function buildPaletteDom() {
  paletteEl = el('div', {
    id: 'command-palette',
    className:
      'hidden fixed inset-0 flex flex-col items-stretch sm:items-center justify-start pt-3 sm:pt-[8vh] px-3 sm:px-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/55 backdrop-blur-sm overflow-hidden',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Search curriculum',
    onClick: (e) => {
      if (e.target === paletteEl) togglePalette(false);
    },
  });

  const box = el('div', {
    className:
      'w-full sm:max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border flex flex-col max-h-[min(92dvh,40rem)] min-h-0',
    style: 'background: hsl(var(--surface-elevated)); border-color: hsl(var(--border-subtle))',
  });

  const topBar = el('div', {
    className: 'px-4 py-3 border-b flex items-center gap-2',
    style: 'border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-muted) / 0.5)',
  }, [
    el('span', { className: 'text-sm font-semibold font-serif' }, ['Search syllabus']),
    el('span', { className: 'search-kbd ml-auto' }, ['esc to close']),
  ]);

  const inputWrap = el('div', {
    className: 'flex items-center gap-2 px-4 border-b',
    style: 'border-color: hsl(var(--border-subtle))',
  });
  inputWrap.appendChild(iconSearch());
  inputEl = el('input', {
    type: 'search',
    className: 'flex-1 min-w-0 py-3.5 text-base bg-transparent outline-none',
    placeholder: 'Subjects, topics, readings, IPC, BNS…',
    autocomplete: 'off',
    'aria-autocomplete': 'list',
    onInput: (e) => {
      query = e.target.value;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 180);
    },
  });
  inputWrap.appendChild(inputEl);

  const filterRow = el('div', {
    className: 'flex flex-wrap gap-2 px-4 py-2.5 border-b text-xs',
    style: 'border-color: hsl(var(--border-subtle))',
  });

  filterRow.appendChild(
    buildFilterSelect('Programme', ['', 'llb-3yr', 'llb-5yr'], filterProgramme, (v) => {
      filterProgramme = v;
      runSearch();
    }),
  );
  filterRow.appendChild(
    buildFilterSelect(
      'Semester',
      ['', ...Array.from({ length: 10 }, (_, i) => `sem-${i + 1}`)],
      filterSemester,
      (v) => {
        filterSemester = v;
        runSearch();
      },
    ),
  );
  filterRow.appendChild(
    buildFilterSelect(
      'Type',
      ['', 'subject', 'module', 'topic', 'reading', 'case', 'statute'],
      filterType,
      (v) => {
        filterType = v;
        runSearch();
      },
    ),
  );

  listEl = el('ul', {
    className: 'flex-1 min-h-0 overflow-y-auto overscroll-contain py-2',
    role: 'listbox',
  });

  box.appendChild(topBar);
  box.appendChild(inputWrap);
  box.appendChild(filterRow);
  box.appendChild(listEl);
  paletteEl.appendChild(box);
  document.body.appendChild(paletteEl);
}

function buildFilterSelect(label, values, current, onChange) {
  const wrap = el('label', { className: 'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1', style: 'border-color: hsl(var(--border-subtle))' }, []);
  wrap.appendChild(el('span', { className: 'font-medium', style: 'color: hsl(var(--text-muted))' }, [label]));
  const sel = el('select', {
    className: 'rounded bg-transparent py-0.5 pr-6 text-xs font-medium outline-none',
    style: 'color: hsl(var(--text-primary))',
    onChange: (e) => onChange(e.target.value),
  });
  for (const v of values) {
    sel.appendChild(
      el('option', { value: v }, [v ? v.replace('llb-', '').replace('sem-', 'Sem ') : 'All']),
    );
  }
  sel.value = current;
  wrap.appendChild(sel);
  return wrap;
}

export function togglePalette(show) {
  open = show ?? !open;
  if (!paletteEl) buildPaletteDom();

  if (open) {
    document.dispatchEvent(new CustomEvent('close-mobile-nav-request'));
    filterProgramme = store.programme || '';
    paletteEl.classList.remove('hidden');
    paletteEl.classList.add('flex');
    inputEl.value = '';
    query = '';
    selected = 0;
    runSearch();
    inputEl.focus();
    lastTrigger = document.activeElement;
  } else {
    paletteEl.classList.add('hidden');
    paletteEl.classList.remove('flex');
    if (lastTrigger?.focus) lastTrigger.focus();
  }
}

function runSearch() {
  if (!isSearchReady()) {
    results = [];
    matchedAliases = [];
    const loading =
      !store.searchIndexError && store.searchIndexReady === false
        ? 'Loading search index…'
        : store.searchIndexError || getInitError();
    renderResults(loading);
    return;
  }

  const res = search({
    query,
    programmeId: filterProgramme,
    semesterId: filterSemester,
    recordType: filterType,
    preferredProgrammeId: store.programme || 'llb-3yr',
    limit: 50,
  });

  results = res.results;
  matchedAliases = res.matchedAliases;
  selected = 0;
  renderResults(res.error);
}

function typeBadgeClass(recordType) {
  if (recordType === 'subject' || recordType === 'topic') return `type-badge type-badge--${recordType}`;
  return 'type-badge';
}

function renderResults(errorMsg) {
  clear(listEl);

  if (errorMsg) {
    listEl.appendChild(el('li', { className: 'px-4 py-4 text-sm text-red-600' }, [errorMsg]));
    return;
  }

  if (matchedAliases.length && query.trim()) {
    listEl.appendChild(
      el('li', {
        className: 'mx-3 my-2 px-3 py-2 text-xs rounded-lg border',
        style: 'border-color: hsl(38 80% 70%); background: hsl(48 96% 94%); color: hsl(32 70% 28%)',
      }, [`Alias match (${matchedAliases.map((a) => a.term).join(', ')}) — ${matchedAliases[0].disclaimer}`]),
    );
  }

  if (!query.trim()) {
    listEl.appendChild(
      el('li', { className: 'px-4 py-8 text-sm text-center', style: 'color: hsl(var(--text-muted))' }, [
        'Search across all programmes and semesters. Try a subject name, topic, or legal alias (IPC, BNS).',
      ]),
    );
    return;
  }

  if (!results.length) {
    listEl.appendChild(
      el('li', { className: 'px-4 py-8 text-sm text-center', style: 'color: hsl(var(--text-muted))' }, [
        'No results. Try another spelling or clear filters.',
      ]),
    );
    return;
  }

  results.forEach((r, i) => {
    const hl = excerptWithSafeHighlight(r.excerptSource, query);
    const row = el('li', { role: 'option', 'aria-selected': i === selected ? 'true' : 'false' });
    const btn = el(
      'button',
      {
        type: 'button',
        id: `search-result-${i}`,
        className: 'w-full text-left px-4 py-3 text-sm transition-colors border-l-2',
        style:
          i === selected
            ? 'background: hsl(var(--brand-indigo) / 0.1); border-color: hsl(var(--brand-indigo))'
            : 'border-color: transparent',
        onClick: () => go(r),
      },
      [
        el('div', { className: 'flex items-start gap-2 min-w-0' }, [
          el('span', { className: typeBadgeClass(r.recordType) }, [r.recordType]),
          el('span', { className: 'font-medium leading-snug', style: 'color: hsl(var(--text-primary))' }, [
            r.displayTitle,
          ]),
        ]),
        el('div', { className: 'text-xs mt-1.5 pl-0.5', style: 'color: hsl(var(--text-muted))' }, [
          formatBreadcrumb(r.route, r),
        ]),
        el('p', { className: 'text-xs mt-2 line-clamp-2 pl-0.5', style: 'color: hsl(var(--text-secondary))' }, [
          hl.before,
          hl.match
            ? el('mark', {
                className: 'rounded px-0.5 font-medium',
                style: 'background: hsl(48 96% 75%); color: hsl(var(--text-primary))',
              }, [hl.match])
            : '',
          hl.after,
        ]),
      ],
    );
    row.appendChild(btn);
    listEl.appendChild(row);
  });
}

function go(result) {
  navigateToSearchResult(result, {
    preferredProgrammeId: filterProgramme || store.programme,
    filterProgrammeId: filterProgramme,
  });
  togglePalette(false);
}

export function openSearchHint() {
  togglePalette(true);
}
