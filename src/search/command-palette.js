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
    className: 'hidden fixed inset-0 z-[60] items-start justify-center pt-[10vh] px-4 bg-black/50',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Search curriculum',
    onClick: (e) => {
      if (e.target === paletteEl) togglePalette(false);
    },
  });

  const box = el('div', {
    className: 'w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-700 overflow-hidden',
  });

  const filterRow = el('div', { className: 'flex flex-wrap gap-2 p-2 border-b dark:border-slate-700 text-xs' });

  filterRow.appendChild(buildFilterSelect('Programme', ['', 'llb-3yr', 'llb-5yr'], (v) => {
    filterProgramme = v;
    runSearch();
  }));
  filterRow.appendChild(
    buildFilterSelect(
      'Semester',
      ['', ...Array.from({ length: 10 }, (_, i) => `sem-${i + 1}`)],
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
      (v) => {
        filterType = v;
        runSearch();
      },
    ),
  );

  inputEl = el('input', {
    type: 'search',
    className: 'w-full px-4 py-3 text-base border-b dark:border-slate-700 bg-transparent outline-none',
    placeholder: 'Search all programmes and semesters…',
    autocomplete: 'off',
    'aria-autocomplete': 'list',
    onInput: (e) => {
      query = e.target.value;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 180);
    },
  });

  listEl = el('ul', { className: 'max-h-[50vh] overflow-y-auto py-2', role: 'listbox' });

  box.appendChild(filterRow);
  box.appendChild(inputEl);
  box.appendChild(listEl);
  paletteEl.appendChild(box);
  document.body.appendChild(paletteEl);
}

function buildFilterSelect(label, values, onChange) {
  const wrap = el('label', { className: 'flex items-center gap-1' }, [`${label}:`]);
  const sel = el('select', {
    className: 'rounded border dark:border-slate-600 bg-transparent px-1 py-0.5',
    onChange: (e) => onChange(e.target.value),
  });
  for (const v of values) {
    sel.appendChild(
      el('option', { value: v }, [v ? v.replace('llb-', '').replace('sem-', 'Sem ') : 'All']),
    );
  }
  wrap.appendChild(sel);
  return wrap;
}

export function togglePalette(show) {
  open = show ?? !open;
  if (!paletteEl) buildPaletteDom();

  if (open) {
    filterProgramme = store.programme || '';
    if (!isSearchReady()) {
      /* still show UI with error */
    }
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
    renderResults(getInitError());
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

function renderResults(errorMsg) {
  clear(listEl);

  if (errorMsg) {
    listEl.appendChild(el('li', { className: 'px-4 py-3 text-sm text-red-600' }, [errorMsg]));
    return;
  }

  if (matchedAliases.length && query.trim()) {
    listEl.appendChild(
      el('li', { className: 'px-4 py-2 text-xs text-amber-700 dark:text-amber-400 border-b dark:border-slate-800' }, [
        `Alias: ${matchedAliases.map((a) => a.term).join(', ')} — ${matchedAliases[0].disclaimer}`,
      ]),
    );
  }

  if (!query.trim()) {
    listEl.appendChild(
      el('li', { className: 'px-4 py-3 text-sm opacity-60' }, [
        'Type to search the full curriculum (all semesters). Try a subject, IPC, or BNS.',
      ]),
    );
    return;
  }

  if (!results.length) {
    listEl.appendChild(
      el('li', { className: 'px-4 py-3 text-sm opacity-60' }, [
        'No results. Try another spelling, clear filters, or search IPC/BNS aliases.',
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
        className: `w-full text-left px-4 py-2 text-sm ${
          i === selected ? 'bg-indigo-100 dark:bg-indigo-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
        }`,
        onClick: () => go(r),
      },
      [
        el('div', { className: 'flex items-center gap-2' }, [
          el('span', { className: 'text-[10px] uppercase opacity-50 shrink-0' }, [r.recordType]),
          el('span', { className: 'font-medium' }, [r.displayTitle]),
        ]),
        el('div', { className: 'text-xs opacity-60 mt-0.5' }, [formatBreadcrumb(r.route, r)]),
        el('p', { className: 'text-xs mt-1 opacity-80 line-clamp-2' }, [
          hl.before,
          hl.match ? el('mark', { className: 'bg-yellow-200 dark:bg-yellow-900 rounded px-0.5' }, [hl.match]) : '',
          hl.after,
        ]),
      ],
    );
    row.appendChild(btn);
    listEl.appendChild(row);
  });
}

function go(result) {
  navigateToSearchResult(result);
  togglePalette(false);
}

export function openSearchHint() {
  togglePalette(true);
}
