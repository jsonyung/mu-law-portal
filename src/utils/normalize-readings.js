/** Merge PDF line-break artifacts in syllabus bibliography lines. */

const ORPHAN_FRAGMENT = /^(th|st|nd|rd|ed\.?|vol\.?|pp\.?|supplement\s+\d{4}\)?)$/i;
const STARTS_NEW_ENTRY =
  /^(\d+[\.)]\s+|\.?\s*[A-Z][a-z].*,|\bBare Act:|^\.?\s*[A-Z][\w.']+\s*,)/;

/** PDF sometimes emits many titles as one space-separated run-on line. */
const RUN_ON_ENTRY_START =
  /(?:^|\s)(Criminal Law:|Commentary on|Textbook of|Criminal Jurisprudence|Law of Crimes|The Indian Penal Code|Simplest book on|Lectures on|The Criminal Law Manual|Bare Act:)/g;

function splitRunOnBibliographyLine(line) {
  const byCount = (line.match(/\sby\s/gi) || []).length;
  if (byCount < 2 || line.length < 80) return [line];

  const starts = [];
  let match;
  RUN_ON_ENTRY_START.lastIndex = 0;
  while ((match = RUN_ON_ENTRY_START.exec(line)) !== null) {
    const idx = match.index + (match[0].startsWith(' ') ? 1 : 0);
    if (!starts.includes(idx)) starts.push(idx);
  }
  starts.sort((a, b) => a - b);
  if (starts.length < 2) return [line];

  const parts = [];
  for (let i = 0; i < starts.length; i++) {
    const chunk = line.slice(starts[i], starts[i + 1]).trim();
    if (chunk) parts.push(chunk);
  }
  return parts;
}

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

  const expanded = merged.flatMap(splitRunOnBibliographyLine);
  return expanded.filter((l) => l.length > 2 && !ORPHAN_FRAGMENT.test(l));
}
