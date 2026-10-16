import MiniSearch from 'minisearch';
import { expandQueryWithAliases, normalizeQuery } from './normalize-query.js';
import { rankSearchResults } from './rank-results.js';
import { buildNavigationTarget } from './navigation-target.js';

let mini = null;
let documentsById = new Map();
let aliases = [];
let meta = null;
let initError = null;

export function getSearchMeta() {
  return meta;
}

export function initSearchService(searchIndexPayload) {
  initError = null;
  documentsById = new Map();
  aliases = searchIndexPayload?.aliases || [];
  meta = searchIndexPayload?.meta || null;

  if (!searchIndexPayload?.meta || searchIndexPayload.meta.indexVersion !== 2) {
    initError = 'Search index version unsupported. Run npm run build:curriculum.';
    mini = null;
    return false;
  }

  const docs = searchIndexPayload.documents || [];
  for (const d of docs) {
    documentsById.set(d.id, d);
  }

  mini = new MiniSearch({
    idField: 'id',
    fields: ['displayTitle', 'subjectTitle', 'moduleTitle', 'topicTitle', 'searchText', 'searchTextRaw'],
    storeFields: [
      'id',
      'recordType',
      'displayTitle',
      'excerptSource',
      'programmeIds',
      'routes',
      'subjectSlug',
      'subjectTitle',
      'moduleId',
      'moduleTitle',
      'topicId',
      'topicTitle',
      'sectionRef',
    ],
    searchOptions: {
      boost: {
        displayTitle: 4,
        topicTitle: 3,
        subjectTitle: 2,
        moduleTitle: 2,
        searchText: 1,
      },
      prefix: true,
      fuzzy: 0.15,
    },
  });

  mini.addAll(
    docs.map((d) => ({
      ...d,
      searchTextRaw: d.searchTextRaw || d.excerptSource || '',
    })),
  );

  return true;
}

export function isSearchReady() {
  return Boolean(mini) && !initError;
}

export function getInitError() {
  return initError;
}

/**
 * @param {object} options
 * @param {string} options.query
 * @param {string} [options.programmeId] - filter: must include programme (empty = all)
 * @param {string} [options.semesterId] - filter semester on matching route
 * @param {string} [options.recordType] - filter record type
 * @param {string} [options.preferredProgrammeId] - for route picking, not filtering
 * @param {number} [options.limit]
 */
export function search(options) {
  const {
    query,
    programmeId = '',
    semesterId = '',
    recordType = '',
    preferredProgrammeId = 'llb-3yr',
    limit = 50,
  } = options;

  if (!mini) {
    return { results: [], matchedAliases: [], error: initError || 'Search not initialized' };
  }

  const trimmed = (query || '').trim();
  if (!trimmed) {
    return { results: [], matchedAliases: [], error: null };
  }

  const { expandedQuery, matchedAliases } = expandQueryWithAliases(trimmed, aliases);
  const miniHits = mini.search(expandedQuery);
  let ranked = rankSearchResults(trimmed, miniHits, documentsById);

  ranked = ranked.filter((doc) => {
    if (recordType && doc.recordType !== recordType) return false;
    if (programmeId && !(doc.programmeIds || []).includes(programmeId)) return false;
    if (semesterId) {
      const hasSem = (doc.routes || []).some((r) => r.semesterId === semesterId);
      if (!hasSem) return false;
    }
    return true;
  });

  const results = ranked.slice(0, limit).map((doc) => {
    const navigationTarget = buildNavigationTarget(doc, preferredProgrammeId, programmeId);
    return {
      ...doc,
      navigationTarget,
      route: navigationTarget
        ? {
            programmeId: navigationTarget.programmeId,
            semesterId: navigationTarget.semesterId,
            path: navigationTarget.hash,
            subjectSlug: navigationTarget.subjectSlug,
            moduleId: navigationTarget.moduleId,
            topicId: navigationTarget.topicId,
          }
        : pickRoute(doc, preferredProgrammeId, programmeId),
      matchedAliases: matchedAliases.length ? matchedAliases : undefined,
    };
  });

  return { results, matchedAliases, error: null };
}

export function pickRoute(doc, preferredProgrammeId, filterProgrammeId) {
  const routes = doc.routes || [];
  if (!routes.length) return null;

  const targetProg = filterProgrammeId || preferredProgrammeId;
  const exact = routes.find((r) => r.programmeId === targetProg);
  if (exact) return exact;

  return routes[0];
}

export function formatBreadcrumb(route, doc) {
  if (!route) return doc.subjectTitle || doc.displayTitle || '';
  const sem = route.semesterId?.replace('sem-', 'Sem ') || '';
  const parts = [route.programmeId === 'llb-5yr' ? '5-Year' : '3-Year', sem, doc.subjectTitle];
  if (doc.moduleTitle) parts.push(doc.moduleTitle);
  return parts.filter(Boolean).join(' · ');
}

export function excerptWithSafeHighlight(text, query) {
  const source = text || '';
  const q = normalizeQuery(query);
  if (!source || !q) return { before: source, match: '', after: '' };

  const lower = source.toLowerCase();
  const idx = lower.indexOf(q.split(/\s+/)[0] || q);
  if (idx < 0) {
    return { before: source.slice(0, 120), match: '', after: source.length > 120 ? '…' : '' };
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(source.length, idx + 80);
  const slice = source.slice(start, end);
  const relIdx = slice.toLowerCase().indexOf((q.split(/\s+/)[0] || q).toLowerCase());
  if (relIdx < 0) return { before: slice, match: '', after: '' };
  return {
    before: (start > 0 ? '…' : '') + slice.slice(0, relIdx),
    match: slice.slice(relIdx, relIdx + (q.split(/\s+/)[0] || q).length),
    after: slice.slice(relIdx + (q.split(/\s+/)[0] || q).length) + (end < source.length ? '…' : ''),
  };
}
