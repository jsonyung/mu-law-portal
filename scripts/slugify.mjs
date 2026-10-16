/**
 * Stable URL slug from title text.
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return 'untitled';
  return text
    .normalize('NFKD')
    .replace(/[\u2013\u2014–—]/g, '-')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'untitled';
}

export function uniqueSlug(base, used) {
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}
