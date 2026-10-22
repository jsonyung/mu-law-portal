import './styles/main.css';
import { store, setStore, initTheme, setProgramme } from './state/store.js';
import { initRouter, onRouteChange } from './router/hash-router.js';
import { mountShell } from './ui/shell.js';
import { initCommandPalette } from './search/command-palette.js';
import { assertCurriculumSchema } from './constants/schema.js';
import { loadSearchIndexInBackground } from './search/load-search-index.js';

async function boot() {
  initTheme();
  const savedProg = localStorage.getItem('mu-law-programme');
  if (savedProg) setProgramme(savedProg);

  const base = import.meta.env.BASE_URL;
  const curriculum = await fetch(`${base}data/curriculum.json`).then((r) => {
    if (!r.ok) throw new Error(`curriculum.json HTTP ${r.status}`);
    return r.json();
  });

  assertCurriculumSchema(curriculum.meta);
  setStore({
    curriculum,
    searchIndex: null,
    searchIndexReady: false,
    searchIndexError: null,
  });

  mountShell(document.getElementById('app'));
  initRouter();
  initCommandPalette();
  onRouteChange();

  loadSearchIndexInBackground(base);
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML =
    '<p class="p-8 text-red-600">Failed to load curriculum. Run npm run build:curriculum and refresh.</p>';
});
