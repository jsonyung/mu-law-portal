import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(__dirname, '../data/overrides/module-titles.json');

/**
 * Fill empty module.title from overrides (never overwrite parser-derived titles).
 * @param {Record<string, object>} subjects
 */
export function mergeModuleTitles(subjects) {
  if (!existsSync(OVERRIDES_PATH)) return subjects;

  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'));

  for (const [subjectSlug, modules] of Object.entries(overrides)) {
    const subject = subjects[subjectSlug] ?? Object.values(subjects).find((s) => s.slug === subjectSlug);
    if (!subject) continue;

    for (const [moduleId, title] of Object.entries(modules)) {
      if (!title || typeof title !== 'string') continue;
      const mod = subject.modules?.find((m) => m.id === moduleId);
      if (!mod) continue;
      if (!mod.title?.trim()) {
        mod.title = title.trim();
      }
    }
  }

  return subjects;
}
