import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeSearchText, hashString } from './normalize-text.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALIASES_PATH = join(__dirname, '../../data/overrides/legal-aliases.json');

export function buildPathForSubject(subject, programme, moduleId, topicId) {
  const sem = subject.semesterMap[programme];
  if (!sem) return null;
  let path = `#/${programme}/${sem}/${subject.slug}`;
  if (moduleId) path += `/${moduleId}`;
  if (topicId) path += `/${topicId}`;
  return path;
}

function buildRoutes(subject, moduleId, topicId) {
  const routes = [];
  for (const programmeId of Object.keys(subject.semesterMap || {})) {
    const path = buildPathForSubject(subject, programmeId, moduleId, topicId);
    if (!path) continue;
    routes.push({
      programmeId,
      semesterId: subject.semesterMap[programmeId],
      path,
      subjectSlug: subject.slug,
      moduleId: moduleId || null,
      topicId: topicId || null,
    });
  }
  return routes;
}

function enrichmentSearchParts(topic) {
  const parts = [];
  const e = topic.enrichment;
  if (!e) return parts;
  if (e.definition) parts.push(e.definition);
  for (const s of e.statutory || []) {
    parts.push(s.act, ...(s.sections || []), s.note);
  }
  for (const c of e.cases || []) {
    parts.push(c.name, c.citation, c.court, c.proposition);
  }
  for (const chk of e.examChecklist || []) {
    parts.push(chk.text);
  }
  return parts.filter(Boolean);
}

function loadAliasConfig() {
  return JSON.parse(readFileSync(ALIASES_PATH, 'utf8'));
}

/**
 * @param {Record<string, object>} subjects
 * @param {string[]} subjectOrder
 * @param {{ generatedAt: string, source: string }} curriculumMeta
 */
export function buildSearchIndexV2(subjects, subjectOrder, curriculumMeta) {
  const aliasConfig = loadAliasConfig();
  const documents = [];
  const usedIds = new Set();
  let readingCounter = 0;

  function pushDoc(doc) {
    if (usedIds.has(doc.id)) {
      throw new Error(`Duplicate search index id: ${doc.id}`);
    }
    usedIds.add(doc.id);
    documents.push(doc);
  }

  for (const subjectKey of subjectOrder) {
    const s = subjects[subjectKey];
    const programmeIds = Object.keys(s.semesterMap || {});
    const subjectSearchRaw = [s.title, s.objectives, s.outcomes, ...(s.readings || [])].join(' ');

    pushDoc({
      id: `subject:${s.slug}`,
      recordType: 'subject',
      programmeIds,
      routes: buildRoutes(s),
      subjectSlug: s.slug,
      subjectTitle: s.title,
      moduleId: null,
      moduleTitle: null,
      topicId: null,
      topicTitle: null,
      sectionRef: null,
      displayTitle: s.title,
      excerptSource: s.title,
      searchText: normalizeSearchText(subjectSearchRaw),
      searchTextRaw: subjectSearchRaw.slice(0, 8000),
    });

    for (const mod of s.modules || []) {
      const modTitle = mod.title || mod.id;
      pushDoc({
        id: `module:${s.slug}:${mod.id}`,
        recordType: 'module',
        programmeIds,
        routes: buildRoutes(s, mod.id),
        subjectSlug: s.slug,
        subjectTitle: s.title,
        moduleId: mod.id,
        moduleTitle: modTitle,
        topicId: null,
        topicTitle: null,
        sectionRef: null,
        displayTitle: modTitle,
        excerptSource: modTitle,
        searchText: normalizeSearchText([modTitle, s.title].join(' ')),
        searchTextRaw: modTitle,
      });

      for (const topic of mod.topics || []) {
        const enrichParts = enrichmentSearchParts(topic);
        const raw = [topic.title, topic.syllabusText, topic.sectionRef, ...enrichParts].filter(Boolean).join(' ');
        pushDoc({
          id: `topic:${s.slug}:${mod.id}:${topic.id}`,
          recordType: 'topic',
          programmeIds,
          routes: buildRoutes(s, mod.id, topic.id),
          subjectSlug: s.slug,
          subjectTitle: s.title,
          moduleId: mod.id,
          moduleTitle: modTitle,
          topicId: topic.id,
          topicTitle: topic.title,
          sectionRef: topic.sectionRef,
          displayTitle: topic.title,
          excerptSource: topic.syllabusText || topic.title,
          searchText: normalizeSearchText(raw),
          searchTextRaw: raw.slice(0, 4000),
        });

        for (const c of topic.enrichment?.cases || []) {
          if (!c.name) continue;
          pushDoc({
            id: `case:${s.slug}:${mod.id}:${topic.id}:${hashString(c.name)}`,
            recordType: 'case',
            programmeIds,
            routes: buildRoutes(s, mod.id, topic.id),
            subjectSlug: s.slug,
            subjectTitle: s.title,
            moduleId: mod.id,
            moduleTitle: modTitle,
            topicId: topic.id,
            topicTitle: topic.title,
            sectionRef: topic.sectionRef,
            displayTitle: c.name,
            excerptSource: c.proposition || c.name,
            searchText: normalizeSearchText([c.name, c.citation, c.proposition].join(' ')),
            searchTextRaw: [c.name, c.citation, c.proposition].filter(Boolean).join(' — '),
          });
        }

        for (const st of topic.enrichment?.statutory || []) {
          if (!st.act) continue;
          pushDoc({
            id: `statute:${s.slug}:${mod.id}:${topic.id}:${hashString(st.act)}`,
            recordType: 'statute',
            programmeIds,
            routes: buildRoutes(s, mod.id, topic.id),
            subjectSlug: s.slug,
            subjectTitle: s.title,
            moduleId: mod.id,
            moduleTitle: modTitle,
            topicId: topic.id,
            topicTitle: topic.title,
            sectionRef: topic.sectionRef,
            displayTitle: st.act,
            excerptSource: (st.sections || []).join(', ') || st.act,
            searchText: normalizeSearchText([st.act, ...(st.sections || []), st.note].join(' ')),
            searchTextRaw: [st.act, ...(st.sections || [])].join(' — '),
          });
        }
      }
    }

    for (const r of s.readings || []) {
      readingCounter += 1;
      pushDoc({
        id: `reading:${s.slug}:${readingCounter}`,
        recordType: 'reading',
        programmeIds,
        routes: buildRoutes(s),
        subjectSlug: s.slug,
        subjectTitle: s.title,
        moduleId: null,
        moduleTitle: null,
        topicId: null,
        topicTitle: null,
        sectionRef: null,
        displayTitle: r.slice(0, 100),
        excerptSource: r,
        searchText: normalizeSearchText(r),
        searchTextRaw: r,
      });
    }
  }

  return {
    meta: {
      indexVersion: 2,
      generatedAt: curriculumMeta.generatedAt || new Date().toISOString(),
      curriculumSource: curriculumMeta.source,
      documentCount: documents.length,
      aliasConfigHash: hashString(JSON.stringify(aliasConfig)),
    },
    aliases: aliasConfig.aliases,
    documents,
  };
}
