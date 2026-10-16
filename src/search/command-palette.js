import MiniSearch from 'minisearch';
import { el, clear } from '../utils/dom.js';
import { store } from '../state/store.js';
import { navigate } from '../router/hash-router.js';

let mini = null;
let open = false;
let selected = 0;
let query = '';
let results = [];

export function initCommandPalette() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette(true);
    }
    if (!open) return;
    if (e.key === 'Escape') togglePalette(false);
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

function ensureIndex() {
  if (mini) return;
  const docs = store.searchIndex?.documents || [];
  mini = new MiniSearch({
    fields: ['title', 'text', 'sectionRef'],
    storeFields: ['title', 'type', 'path'],
    searchOptions: { boost: { title: 2 }, prefix: true, fuzzy: 0.2 },
  });
  mini.addAll(docs.map((d, i) => ({ ...d, id: d.id || String(i) })));
}

let paletteEl = null;
let listEl = null;

export function togglePalette(show) {
  open = show ?? !open;
  if (!paletteEl) {
    paletteEl = el('div', {
      id: 'command-palette',
      className: 'hidden fixed inset-0 z-[60] items-start justify-center pt-[15vh] px-4 bg-black/50',
      onClick: (e) => {
        if (e.target === paletteEl) togglePalette(false);
      },
    });
    const box = el('div', { className: 'w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-700 overflow-hidden' });
    box.appendChild(
      el('input', {
        type: 'search',
        className: 'w-full px-4 py-3 text-base border-b dark:border-slate-700 bg-transparent outline-none',
        placeholder: 'Search subjects, modules, topics, readings…',
        onInput: (e) => {
          query = e.target.value;
          runSearch();
        },
      }),
    );
    listEl = el('ul', { className: 'max-h-80 overflow-y-auto py-2', role: 'listbox' });
    box.appendChild(listEl);
    paletteEl.appendChild(box);
    document.body.appendChild(paletteEl);
  }

  if (open) {
    ensureIndex();
    paletteEl.classList.remove('hidden');
    paletteEl.classList.add('flex');
    const input = paletteEl.querySelector('input');
    input.value = '';
    query = '';
    runSearch();
    input.focus();
  } else {
    paletteEl.classList.add('hidden');
    paletteEl.classList.remove('flex');
  }
}

function runSearch() {
  if (!mini) return;
  results = query.trim() ? mini.search(query).slice(0, 20) : [];
  selected = 0;
  renderResults();
}

function renderResults() {
  clear(listEl);
  if (!results.length) {
    listEl.appendChild(el('li', { className: 'px-4 py-3 text-sm opacity-60' }, ['No results — try a case name or topic keyword.']));
    return;
  }
  results.forEach((r, i) => {
    listEl.appendChild(
      el('li', {}, [
        el('button', {
          type: 'button',
          className: `w-full text-left px-4 py-2 text-sm ${
            i === selected ? 'bg-indigo-100 dark:bg-indigo-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
          }`,
          onClick: () => go(r),
        }, [
          el('span', { className: 'text-[10px] uppercase opacity-50 mr-2' }, [r.type]),
          r.title,
        ]),
      ]),
    );
  });
}

function go(result) {
  const path = result.path?.replace(/^#/, '') || '';
  if (path) location.hash = path.startsWith('/') ? path : `/${path}`;
  togglePalette(false);
}

export function openSearchHint() {
  togglePalette(true);
}
