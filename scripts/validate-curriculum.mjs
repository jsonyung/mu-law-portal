import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CURR_PATH = join(ROOT, 'data/generated/curriculum.json');
const REPORT_PATH = join(ROOT, 'data/generated/parse-report.json');
const MODULE_TITLES_PATH = join(ROOT, 'data/overrides/module-titles.json');
const MAX_WARNINGS = Number(process.env.MAX_PARSE_WARNINGS ?? '9999');

function fail(msg) {
  console.error(`validate-curriculum: ${msg}`);
  process.exit(1);
}

if (!existsSync(CURR_PATH)) {
  fail('Missing data/generated/curriculum.json — run npm run build:curriculum');
}

const curriculum = JSON.parse(readFileSync(CURR_PATH, 'utf8'));
if (curriculum.meta?.schemaVersion == null) {
  fail('curriculum.meta.schemaVersion is required');
}

const subjects = curriculum.subjects || {};
let issues = 0;

for (const id of curriculum.subjectOrder || []) {
  const s = subjects[id];
  if (!s) {
    console.warn(`missing subject: ${id}`);
    issues += 1;
    continue;
  }
  if (!s.readings?.length) {
    console.warn(`no readings (informational): ${s.slug} (${s.title})`);
  }
  for (const mod of s.modules || []) {
    for (const topic of mod.topics || []) {
      if (!topic.id) {
        console.warn(`topic missing id: ${s.slug} ${mod.id}`);
        issues += 1;
      }
    }
  }
}

if (existsSync(MODULE_TITLES_PATH)) {
  const overrides = JSON.parse(readFileSync(MODULE_TITLES_PATH, 'utf8'));
  for (const [subjectSlug, modules] of Object.entries(overrides)) {
    const s = subjects[subjectSlug] ?? Object.values(subjects).find((x) => x.slug === subjectSlug);
    if (!s) {
      console.warn(`module-titles override: unknown subject ${subjectSlug}`);
      issues += 1;
      continue;
    }
    for (const moduleId of Object.keys(modules)) {
      if (!s.modules?.some((m) => m.id === moduleId)) {
        console.warn(`module-titles override: unknown module ${moduleId} on ${subjectSlug}`);
        issues += 1;
      }
    }
  }
}

if (existsSync(REPORT_PATH)) {
  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  const n = (report.warnings || []).length;
  if (n > MAX_WARNINGS) {
    fail(`${n} parse warnings exceeds MAX_PARSE_WARNINGS=${MAX_WARNINGS}`);
  }
}

if (issues > 0) {
  fail(`${issues} curriculum validation issue(s)`);
}

console.log('Curriculum validation OK');
