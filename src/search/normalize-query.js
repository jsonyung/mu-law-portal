export function normalizeQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2013\u2014–—]/g, '-')
    .replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeQuery(text) {
  const n = normalizeQuery(text);
  return n ? n.split(/\s+/).filter(Boolean) : [];
}

/**
 * Expand query using alias config when user types a known abbreviation.
 * @returns {{ expandedQuery: string, matchedAliases: Array<{ id, term, disclaimer }> }}
 */
export function expandQueryWithAliases(rawQuery, aliases = []) {
  const matchedAliases = [];
  const extraTerms = [];
  const qNorm = normalizeQuery(rawQuery);

  for (const alias of aliases) {
    const hit = (alias.terms || []).some((t) => {
      const tn = normalizeQuery(t);
      return qNorm === tn || qNorm.includes(tn) || tn.includes(qNorm);
    });
    if (hit) {
      matchedAliases.push({
        id: alias.id,
        term: alias.terms?.[0] || alias.id,
        disclaimer: alias.disclaimer,
      });
      extraTerms.push(...(alias.expandTo || []));
    }
  }

  const expandedQuery = [rawQuery, ...extraTerms].join(' ').trim();
  return { expandedQuery, matchedAliases };
}
