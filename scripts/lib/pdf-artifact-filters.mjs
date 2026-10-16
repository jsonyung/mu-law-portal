const PAGE_NUM_ONLY = /^\d{1,3}$/;
const SEPARATOR = /^---$/;
const BOILERPLATE = /^University of Mumbai$/i;
const SYLLABUS_TITLE = /^Revised Syllabus for|^SYLLABI OF|^Syllabus for Approval/i;

export function isSkippableLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (PAGE_NUM_ONLY.test(t)) return true;
  if (SEPARATOR.test(t)) return true;
  if (BOILERPLATE.test(t)) return true;
  if (SYLLABUS_TITLE.test(t)) return true;
  if (/^https?:\/\//.test(t)) return true;
  return false;
}

export function truncateBeforeEditorial(lines) {
  const idx = lines.findIndex((l) =>
    /^##\s+Editorial and portal implementation notes/i.test(l.trim()),
  );
  return idx >= 0 ? lines.slice(0, idx) : lines;
}
