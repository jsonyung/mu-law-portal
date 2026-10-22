import { assertSearchIndexSchema } from '../constants/schema.js';
import { initSearchService } from './search-service.js';
import { setStore } from '../state/store.js';

/**
 * Load search index after first paint (curriculum already in store).
 * @param {string} baseUrl import.meta.env.BASE_URL
 */
export function loadSearchIndexInBackground(baseUrl) {
  const url = `${baseUrl}data/search-index.json`;
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((searchIndex) => {
      assertSearchIndexSchema(searchIndex.meta);
      if (!initSearchService(searchIndex)) {
        console.warn('Search index init failed:', searchIndex?.meta);
        setStore({ searchIndexReady: false, searchIndexError: 'Search index could not be loaded.' });
        return;
      }
      setStore({ searchIndex: searchIndex, searchIndexReady: true, searchIndexError: null });
      document.dispatchEvent(new CustomEvent('search-index-ready'));
    })
    .catch((err) => {
      console.warn('Search index fetch failed:', err);
      setStore({
        searchIndexReady: false,
        searchIndexError: 'Search is unavailable. Check your connection and refresh.',
      });
    });
}
