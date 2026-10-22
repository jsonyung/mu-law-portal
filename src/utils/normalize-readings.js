/** Merge PDF line-break artifacts in syllabus bibliography lines. */

const ORPHAN_FRAGMENT = /^(th|st|nd|rd|ed\.?|vol\.?|pp\.?|supplement\s+\d{4}\)?)$/i;
const STARTS_NEW_ENTRY =
  /^(\d+[\.)]\s+|\.?\s*[A-Z][a-z].*,|\bBare Act:|^\.?\s*[A-Z][\w.']+\s*,)/;

function cleanLine(line) {
  return String(line || '')
    .replace(/^[\d.\u2022\uF0B7\-*]\s*/, '')
    .replace(/^\.\s+/, '')
    .trim();
}

/**
 * @param {string[]} raw
 * @returns {string[]}
 */
export function normalizeReadingList(raw) {
  if (!Array.isArray(raw) || !raw.length) return [];

  const merged = [];
  for (const item of raw) {
    const line = cleanLine(item);
    if (!line) continue;

    const isContinuation =
      merged.length > 0 &&
      (ORPHAN_FRAGMENT.test(line) ||
        /^[a-z(]/.test(line) ||
        (!STARTS_NEW_ENTRY.test(line) && line.length < 48));

    if (isContinuation) {
      const prev = merged[merged.length - 1];
      let next = prev;
      if (/^(th|st|nd|rd)$/i.test(line)) {
        const edMatch = prev.match(/\((\d+)\s+ed\./i);
        if (edMatch) {
          next = prev.replace(`(${edMatch[1]} ed.`, `(${edMatch[1]}${line.toLowerCase()} ed.`);
        } else if (/\d$/.test(prev)) {
          next = prev + line.toLowerCase();
        } else {
          next = `${prev} ${line}`;
        }
      } else {
        next = `${prev} ${line}`;
      }
      merged[merged.length - 1] = next.replace(/\s+/g, ' ').trim();
    } else {
      merged.push(line);
    }
  }

  return merged.filter((l) => l.length > 2 && !ORPHAN_FRAGMENT.test(l));
}
