import { normalizeQuery } from './normalize-query.js';

function titleMatchesQuery(titleNorm, q, tokens) {
  if (!q) return false;
  if (titleNorm === q) return true;
  if (titleNorm.startsWith(q)) return true;
  return tokens.length > 0 && tokens.every((t) => titleNorm.includes(t));
}

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
      const topicTitleNorm = normalizeQuery(doc.topicTitle || '');
      const subjectTitleNorm = normalizeQuery(doc.subjectTitle || '');
      let tier = 5;

      if (titleMatchesQuery(titleNorm, q, tokens)) {
        tier = titleNorm === q ? 0 : 1;
      } else if (doc.topicTitle && titleMatchesQuery(topicTitleNorm, q, tokens)) {
        tier = 2;
      } else if (doc.recordType === 'subject' && titleMatchesQuery(subjectTitleNorm, q, tokens)) {
        tier = 2;
      } else if (doc.recordType === 'topic' || doc.recordType === 'case' || doc.recordType === 'statute') {
        tier = 3;
      } else if (doc.recordType === 'subject' || doc.recordType === 'module') {
        tier = 4;
      }

      if (doc.recordType === 'reading' && tokens.length <= 2) {
        const subjectMatches = titleMatchesQuery(subjectTitleNorm, q, tokens);
        if (!subjectMatches) tier = Math.min(tier + 1, 6);
      }

      if ((q.includes('tort') || q === 'torts') && subjectTitleNorm.includes('tort') && doc.recordType === 'subject') {
        tier = Math.min(tier, 1);
      }

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
