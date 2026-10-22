import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CURR_PATH = join(ROOT, 'data/generated/curriculum.json');
const OUT_DIR = join(ROOT, 'content/enrichment/topics');

function usage() {
  console.log(`Usage: npm run enrich:scaffold -- --topic <topicId> [--subject <subject-slug>]`);
  process.exit(1);
}

const args = process.argv.slice(2);
let topicId = '';
let subjectSlug = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--topic') topicId = args[++i] || '';
  if (args[i] === '--subject') subjectSlug = args[++i] || '';
}
if (!topicId) usage();

if (!existsSync(CURR_PATH)) {
  console.error('Run npm run build:curriculum first.');
  process.exit(1);
}

const curriculum = JSON.parse(readFileSync(CURR_PATH, 'utf8'));
let found = null;

for (const sid of curriculum.subjectOrder || []) {
  const s = curriculum.subjects[sid];
  if (subjectSlug && s.slug !== subjectSlug) continue;
  for (const mod of s.modules || []) {
    for (const topic of mod.topics || []) {
      if (topic.id === topicId) {
        found = { subject: s, mod, topic };
        break;
      }
    }
  }
}

if (!found) {
  console.error(`Topic not found: ${topicId}${subjectSlug ? ` in ${subjectSlug}` : ''}`);
  process.exit(1);
}

const outPath = join(OUT_DIR, `${topicId}.json`);
if (existsSync(outPath)) {
  console.error(`Already exists: ${outPath}`);
  process.exit(1);
}

const template = {
  topicId,
  definition: null,
  statutoryReferences: [],
  cases: [],
  examChecklist: [{ id: 'chk-1', text: `Syllabus: ${found.topic.title}` }],
  lastVerified: new Date().toISOString().slice(0, 10),
};

writeFileSync(outPath, `${JSON.stringify(template, null, 2)}\n`);
console.log(`Wrote ${outPath}`);
