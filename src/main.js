import './styles/main.css';
import { store, setStore, initTheme, setProgramme } from './state/store.js';
import { initRouter, onRouteChange } from './router/hash-router.js';
import { mountShell } from './ui/shell.js';
import { initCommandPalette } from './search/command-palette.js';

async function boot() {
  initTheme();
  const savedProg = localStorage.getItem('mu-law-programme');
  if (savedProg) setProgramme(savedProg);

  const base = import.meta.env.BASE_URL;
  const [curriculum, searchIndex] = await Promise.all([
    fetch(`${base}data/curriculum.json`).then((r) => r.json()),
    fetch(`${base}data/search-index.json`).then((r) => r.json()),
  ]);

  setStore({ curriculum, searchIndex });

  mountShell(document.getElementById('app'));
  initRouter();
  initCommandPalette();
  onRouteChange();

  document.body.addEventListener('click', () => {
    document.querySelectorAll('[data-drawer]').forEach((n) => n.remove());
  });
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML =
    '<p class="p-8 text-red-600">Failed to load curriculum. Run npm run build:curriculum and refresh.</p>';
});
