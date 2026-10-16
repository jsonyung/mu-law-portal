import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCurriculumMarkdown } from './lib/state-machine-parser.mjs';
import { mergeEnrichment } from './merge-enrichment.mjs';
import { buildSearchIndexV2 } from './lib/build-search-index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MD_PATH = join(ROOT, 'university_mumbai_llb_master_curriculum.md');
const OUT_DIR = join(ROOT, 'data/generated');
const PUBLIC_DATA = join(ROOT, 'public/data');
const THEMES_PATH = join(ROOT, 'data/overrides/subject-themes.json');
const SLUG_OVERRIDES_PATH = join(ROOT, 'data/overrides/subject-slugs.json');

function buildProgrammes(subjects, subjectOrder) {
  const llb3Semesters = new Set();
  const llb5Semesters = new Set();
  const byProgrammeSem = { 'llb-3yr': {}, 'llb-5yr': {} };

  for (const id of subjectOrder) {
    const s = subjects[id];
    for (const [prog, sem] of Object.entries(s.semesterMap)) {
      if (prog === 'llb-3yr') llb3Semesters.add(sem);
      if (prog === 'llb-5yr') llb5Semesters.add(sem);
      if (!byProgrammeSem[prog][sem]) byProgrammeSem[prog][sem] = [];
      byProgrammeSem[prog][sem].push(s.slug);
    }
  }

  const sortSem = (a, b) => parseInt(a.replace('sem-', ''), 10) - parseInt(b.replace('sem-', ''), 10);

  return [
    {
      id: 'llb-3yr',
      title: 'LL.B. (3-Year)',
      semesters: [...llb3Semesters].sort(sortSem),
      subjectsBySemester: byProgrammeSem['llb-3yr'],
    },
    {
      id: 'llb-5yr',
      title: 'BLS LL.B. (5-Year Integrated)',
      semesters: [...llb5Semesters].sort(sortSem),
      subjectsBySemester: byProgrammeSem['llb-5yr'],
    },
  ];
}

function applyThemes(subjects, themes) {
  for (const s of Object.values(subjects)) {
    const hue = themes[s.slug] ?? themes[s.id] ?? themes.default ?? 220;
    s.theme = { hue, slug: s.slug };
  }
}

const slugOverrides = JSON.parse(readFileSync(SLUG_OVERRIDES_PATH, 'utf8'));
const themes = JSON.parse(readFileSync(THEMES_PATH, 'utf8'));

const { subjects, subjectOrder, warnings } = parseCurriculumMarkdown(MD_PATH, slugOverrides);
mergeEnrichment(subjects);
applyThemes(subjects, themes);

const programmes = buildProgrammes(subjects, subjectOrder);

const curriculumMeta = {
  source: 'university_mumbai_llb_master_curriculum.md',
  generatedAt: new Date().toISOString(),
  syllabusYear: '2022-23',
};

const curriculum = {
  meta: curriculumMeta,
  programmes,
  subjectOrder,
  subjects,
};

const searchIndex = buildSearchIndexV2(subjects, subjectOrder, curriculumMeta);

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(PUBLIC_DATA, { recursive: true });

writeFileSync(join(OUT_DIR, 'curriculum.json'), JSON.stringify(curriculum, null, 2));
writeFileSync(join(OUT_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
writeFileSync(join(OUT_DIR, 'parse-report.json'), JSON.stringify({ warnings, subjectCount: subjectOrder.length }, null, 2));

cpSync(join(OUT_DIR, 'curriculum.json'), join(PUBLIC_DATA, 'curriculum.json'));
cpSync(join(OUT_DIR, 'search-index.json'), join(PUBLIC_DATA, 'search-index.json'));

console.log(`Parsed ${subjectOrder.length} subjects, ${warnings.length} warnings`);
console.log(`Wrote ${OUT_DIR} and ${PUBLIC_DATA}`);
