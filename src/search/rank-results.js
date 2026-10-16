import { normalizeQuery } from './normalize-query.js';

/**
 * Post-sort MiniSearch hits with legal-education-friendly tiers.
 */
export function rankSearchResults(rawQuery, miniResults, documentsById) {
  const q = normalizeQuery(rawQuery);
  const tokens = q.split(/\s+/).filter(Boolean);

  return [...miniResults]
    .map((hit) => {
      const doc = documentsById.get(hit.id) || hit;
      const titleNorm = normalizeQuery(doc.displayTitle || '');
      let tier = 5;

      if (q && titleNorm === q) tier = 0;
      else if (q && titleNorm.startsWith(q)) tier = 1;
      else if (tokens.length && tokens.every((t) => titleNorm.includes(t))) tier = 2;
      else if (doc.recordType === 'topic' || doc.recordType === 'case' || doc.recordType === 'statute') tier = 3;
      else if (doc.recordType === 'subject' || doc.recordType === 'module') tier = 4;

      return {
        ...doc,
        score: hit.score,
        rankTier: tier,
      };
    })
    .sort((a, b) => {
      if (a.rankTier !== b.rankTier) return a.rankTier - b.rankTier;
      return b.score - a.score;
    });
}
