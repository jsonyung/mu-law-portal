import { readFileSync } from 'fs';
import { slugify, uniqueSlug } from '../slugify.mjs';
import { parseSemesterLabel, semId } from '../normalize-semester.mjs';
import { classifyProgrammeHeading } from '../normalize-programme.mjs';
import { isSkippableLine, truncateBeforeEditorial } from './pdf-artifact-filters.mjs';
import { normalizeReadingList } from '../../src/utils/normalize-readings.js';

const MODULE_H4 =
  /^####\s+Module\s+([IVX\d]+)\s*:?\s*(.*)$/i;
const MODULE_INLINE =
  /^Module\s*:?\s*([IVX\d]+)\s*:?\s*(.*)$/i;
const MODULE_CAPS =
  /^MODULE\s*-\s*([IVX\d]+)\s*(.*)$/i;
const OBJECTIVES_H4 = /^####\s+Course Objectives:?/i;
const OUTCOMES_H4 = /^####\s+Course Outcomes?:?/i;
const LEARNING_OBJECTIVES = /^Learning Objectives:?/i;
const LEARNING_OUTCOMES = /^Learning Outcomes:?/i;
const READINGS_H4 =
  /^####\s+(Recommended Resources|Suggested Readings|Suggested Books)\s*:?\s*$/i;
const COURSE_OUTLINE = /^####\s+Course Outline\s*$/i;

const TOPIC_LINE = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/;
const BULLET_LINE = /^[\u2022\uF0B7\-*]\s+(.+)$/;

const SUBJECT_H3 = /^###\s+(.+)$/;
const SEMESTER_H2 = /^##\s+Semester:\s*(.+)$/i;
const PROGRAM_H1 = /^#\s+Program:/i;

const COURSE_TITLE_LINE =
  /Course Title-?:\s*(.+)$/i;
const COURSE_TITLE_EMBEDDED =
  /Course Title-:\s*(.+)$/i;
const PRACTICAL_TRAINING =
  /Practical Training\s*[–-]\s*I/i;

const ROMAN_MODULE = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

function moduleNumFromToken(token) {
  const t = String(token).trim().toLowerCase();
  return ROMAN_MODULE[t] ?? (parseInt(t, 10) || 1);
}

function moduleId(n) {
  return `module-${n}`;
}

/** PDF often puts `#### Module 2` on one line and the title on the next. */
export function isModuleBannerTitleLine(trimmed) {
  if (!trimmed || trimmed.length < 6) return false;
  if (/^\d+\.\d+\.?\s/.test(trimmed)) return false;
  if (/^\d+[\.)]\s+[A-Z]/.test(trimmed) && /^\d+\.\s/.test(trimmed)) return false;
  if (/^Suggested Books/i.test(trimmed) || /^Recommended Resources/i.test(trimmed)) return false;
  if (READINGS_H4.test(trimmed)) return false;
  if (MODULE_H4.test(trimmed) || MODULE_INLINE.test(trimmed) || MODULE_CAPS.test(trimmed)) return false;
  if (/^Module:\s*\d/i.test(trimmed)) return false;
  if (/^Bare Act:/i.test(trimmed)) return false;
  if (/^(OBJECTIVES|COURSE OUTCOMES|Teaching Scheme)/i.test(trimmed)) return false;
  if (/^[A-Z][A-Z0-9\s:'’\-–—,&()]+$/.test(trimmed)) return true;
  if (/^INDUSTRIAL RELATIONS:/i.test(trimmed)) return true;
  if (/^Sections?\s+\d/i.test(trimmed) || /^Section\s+\d+/i.test(trimmed)) return true;
  if (/^[A-Za-z][A-Za-z0-9\s,'\-–—:&()]+$/.test(trimmed) && trimmed.length <= 160) return true;
  return false;
}

export function normalizeModuleBannerTitle(line) {
  const t = String(line).trim();
  const prefixed = t.match(/^INDUSTRIAL RELATIONS:\s*(.+)$/i);
  if (prefixed) return prefixed[1].trim();
  return t;
}

function emptyEnrichment() {
  return {
    definition: null,
    statutory: [],
    cases: [],
    examChecklist: [],
  };
}

function createSubject(title, ctx) {
  const baseSlug = slugify(title);
  const subjectId = uniqueSlug(baseSlug, ctx.usedSubjectIds);
  return {
    id: subjectId,
    title: title.trim(),
    slug: subjectId,
    isElective: /\(Elective Course\)/i.test(title),
    credits: null,
    courseCode: null,
    semesterMap: { ...ctx.currentSemesterMap },
    programmeScope: ctx.programmeScope,
    objectives: '',
    outcomes: '',
    readings: [],
    modules: [],
    _pendingTitleLine: false,
  };
}

function ensureModule(subject, num, title = '') {
  const id = moduleId(num);
  let mod = subject.modules.find((m) => m.id === id);
  if (!mod) {
    mod = { id, number: num, title: title.trim(), topics: [] };
    subject.modules.push(mod);
    subject.modules.sort((a, b) => a.number - b.number);
  } else if (title && !mod.title) {
    mod.title = title.trim();
  }
  return mod;
}

function addTopic(mod, sectionRef, title, syllabusText, ctx) {
  const base = slugify(title.slice(0, 60));
  const topicId = uniqueSlug(base, ctx.usedTopicIds);
  mod.topics.push({
    id: topicId,
    sectionRef: sectionRef || null,
    title: title.trim(),
    syllabusText: syllabusText.trim(),
    sourceStatus: 'prescribed',
    enrichment: emptyEnrichment(),
  });
}

export function trimObjectivesOrOutcomes(text) {
  const byLine = text.search(/\n(?:####\s+)?Module\s+[IVX\d]/i);
  if (byLine > 0) return text.slice(0, byLine).trim();
  const inline = text.search(/\sModule\s+(?:[IVX\d]+)\s*[:\-]/i);
  if (inline > 24) return text.slice(0, inline).trim();
  return text;
}

function flushSectionBuffer(subject, section, buffer) {
  let text = buffer.join('\n').trim();
  if (!text || !subject) return;
  if (section === 'objectives' || section === 'outcomes') {
    text = trimObjectivesOrOutcomes(text);
  }
  if (section === 'objectives') subject.objectives = text;
  else if (section === 'outcomes') subject.outcomes = text;
  else if (section === 'readings') {
    const items = text
      .split(/\n/)
      .map((l) => l.replace(/^[\d.\u2022\uF0B7\-*]\s*/, '').trim())
      .filter(Boolean);
    subject.readings.push(...normalizeReadingList(items));
  }
}

function parseCreditsAndCode(lines, startIdx) {
  let credits = null;
  let courseCode = null;
  for (let j = startIdx; j < Math.min(startIdx + 8, lines.length); j++) {
    const l = lines[j];
    const cred = l.match(/Credits:\s*(\d+)/i);
    if (cred) credits = parseInt(cred[1], 10);
    const code = l.match(/Course Code:\s*(\S+)/i);
    if (code && code[1] !== 'Credits:') courseCode = code[1];
  }
  return { credits, courseCode };
}

/**
 * @param {string} mdPath
 * @param {Record<string,string>} slugOverrides
 */
export function parseCurriculumMarkdown(mdPath, slugOverrides = {}) {
  const raw = readFileSync(mdPath, 'utf8');
  let lines = raw.split(/\r?\n/);
  lines = truncateBeforeEditorial(lines);

  const warnings = [];
  const usedSubjectIds = new Set();
  const usedTopicIds = new Set();
  const subjects = {};
  const subjectOrder = [];

  let programmeScope = 'five_only';
  let currentSemesterMap = {};
  let currentSubject = null;
  let currentModule = null;
  let section = null;
  let sectionBuffer = [];
  let pendingH3Title = null;
  let pendingMultilineSubject = null;
  let lastSemesterLineIndex = -1;

  const ctx = {
    usedSubjectIds,
    usedTopicIds,
    programmeScope,
    currentSemesterMap,
    pendingMeta: null,
    pendingH3At: -1,
  };

  function registerSubject(subject) {
    const override = slugOverrides[subject.id];
    if (override) {
      subject.slug = override;
      subject.id = override;
    }
    subjects[subject.id] = subject;
    subjectOrder.push(subject.id);
    currentSubject = subject;
    currentModule = null;
    section = null;
    sectionBuffer = [];
  }

  function updateSemesterMap(parsed) {
    currentSemesterMap = {};
    if (parsed.dual) {
      currentSemesterMap['llb-3yr'] = semId(parsed.llb3yr);
      currentSemesterMap['llb-5yr'] = semId(parsed.llb5yr);
    } else {
      if (programmeScope === 'five_only') {
        currentSemesterMap['llb-5yr'] = semId(parsed.single);
      } else if (programmeScope === 'three_only') {
        currentSemesterMap['llb-3yr'] = semId(parsed.single);
      } else {
        currentSemesterMap['llb-3yr'] = semId(parsed.single);
        currentSemesterMap['llb-5yr'] = semId(parsed.single);
      }
    }
    ctx.currentSemesterMap = currentSemesterMap;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isSkippableLine(trimmed)) continue;

    if (PROGRAM_H1.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      sectionBuffer = [];
      currentSubject = null;
      currentModule = null;
      section = null;
      pendingH3Title = null;
      programmeScope = classifyProgrammeHeading(trimmed);
      ctx.programmeScope = programmeScope;
      continue;
    }

    const semMatch = trimmed.match(SEMESTER_H2);
    if (semMatch) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      sectionBuffer = [];
      currentSubject = null;
      currentModule = null;
      section = null;
      lastSemesterLineIndex = i;
      updateSemesterMap(parseSemesterLabel(semMatch[1]));
      if (pendingH3Title) {
        registerSubject(createSubject(pendingH3Title, ctx));
        if (ctx.pendingMeta && currentSubject) {
          currentSubject.credits = ctx.pendingMeta.credits;
          currentSubject.courseCode = ctx.pendingMeta.courseCode;
          ctx.pendingMeta = null;
        }
        pendingH3Title = null;
        pendingMultilineSubject = null;
      }
      continue;
    }

    const h3Match = trimmed.match(SUBJECT_H3);
    if (h3Match) {
      const title = h3Match[1].trim();
      if (/^Standard study callouts$/i.test(title)) continue;
      if (/^Recommended data model$/i.test(title)) continue;
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      sectionBuffer = [];
      pendingMultilineSubject = title;
      pendingH3Title = title;
      ctx.pendingH3At = i;
      continue;
    }

    if (pendingMultilineSubject && trimmed && !trimmed.startsWith('#') && !COURSE_TITLE_LINE.test(trimmed)) {
      if (/^PROTECTION$/i.test(trimmed) && /CONSUMER/i.test(pendingMultilineSubject)) {
        pendingMultilineSubject += ' ' + trimmed;
        pendingH3Title = pendingMultilineSubject;
        continue;
      }
    }

    if (trimmed.match(/^Course Code:/i) && pendingH3Title && !currentSubject) {
      const meta = parseCreditsAndCode(lines, i);
      if (lastSemesterLineIndex > ctx.pendingH3At) {
        registerSubject(createSubject(pendingH3Title, ctx));
        pendingH3Title = null;
        pendingMultilineSubject = null;
        currentSubject.credits = meta.credits;
        currentSubject.courseCode = meta.courseCode;
      } else {
        ctx.pendingMeta = meta;
      }
      continue;
    }

    if (
      pendingH3Title &&
      (OBJECTIVES_H4.test(trimmed) || LEARNING_OBJECTIVES.test(trimmed) || MODULE_H4.test(trimmed))
    ) {
      registerSubject(createSubject(pendingH3Title, ctx));
      pendingH3Title = null;
      pendingMultilineSubject = null;
      if (ctx.pendingMeta) {
        currentSubject.credits = ctx.pendingMeta.credits;
        currentSubject.courseCode = ctx.pendingMeta.courseCode;
        ctx.pendingMeta = null;
      }
    }

    if (COURSE_TITLE_EMBEDDED.test(trimmed) && !currentSubject) {
      const m = trimmed.match(COURSE_TITLE_EMBEDDED);
      let title = m[1].trim();
      registerSubject(createSubject(title, ctx));
      const meta = parseCreditsAndCode(lines, i);
      currentSubject.credits = meta.credits;
      section = 'objectives';
      sectionBuffer = [];
      continue;
    }

    if (PRACTICAL_TRAINING.test(trimmed) && !/^###/.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      sectionBuffer = [];
      registerSubject(createSubject(trimmed.split(/\n/)[0] || 'Practical Training – I', ctx));
      continue;
    }

    if (OBJECTIVES_H4.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'objectives';
      sectionBuffer = [];
      continue;
    }

    if (OUTCOMES_H4.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'outcomes';
      sectionBuffer = [];
      continue;
    }

    if (LEARNING_OBJECTIVES.test(trimmed) && currentSubject) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'objectives';
      sectionBuffer = [];
      continue;
    }

    if (LEARNING_OUTCOMES.test(trimmed) && currentSubject) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'outcomes';
      sectionBuffer = [];
      continue;
    }

    if (READINGS_H4.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'readings';
      sectionBuffer = [];
      continue;
    }

    if (COURSE_OUTLINE.test(trimmed)) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = null;
      sectionBuffer = [];
      continue;
    }

    let modMatch = trimmed.match(MODULE_H4);
    if (!modMatch) modMatch = trimmed.match(MODULE_INLINE);
    if (!modMatch) modMatch = trimmed.match(MODULE_CAPS);
    if (modMatch && currentSubject) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'module_body';
      sectionBuffer = [];
      const num = moduleNumFromToken(modMatch[1]);
      const modTitle = modMatch[2] || '';
      currentModule = ensureModule(currentSubject, num, modTitle);
      if (modTitle && !currentModule.title) currentModule.title = modTitle;
      continue;
    }

    if (/^Module:\s*(\d+)\s*:/i.test(trimmed) && currentSubject) {
      const m = trimmed.match(/^Module:\s*(\d+)\s*:\s*(.*)$/i);
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'module_body';
      sectionBuffer = [];
      const num = parseInt(m[1], 10);
      currentModule = ensureModule(currentSubject, num, m[2]);
      continue;
    }

    if (section && section !== 'module_body' && currentSubject) {
      const moduleBreak =
        MODULE_H4.test(trimmed) || MODULE_INLINE.test(trimmed) || MODULE_CAPS.test(trimmed);
      if (COURSE_OUTLINE.test(trimmed)) {
        flushSectionBuffer(currentSubject, section, sectionBuffer);
        sectionBuffer = [];
        section = null;
      } else if (trimmed.startsWith('#') || moduleBreak) {
        flushSectionBuffer(currentSubject, section, sectionBuffer);
        sectionBuffer = [];
        section = null;
        if (moduleBreak) i -= 1;
        continue;
      } else {
        sectionBuffer.push(line);
        continue;
      }
    }

    if (
      currentModule &&
      section === 'module_body' &&
      !currentModule.title?.trim() &&
      !currentModule.topics.length &&
      isModuleBannerTitleLine(trimmed)
    ) {
      currentModule.title = normalizeModuleBannerTitle(trimmed);
      continue;
    }

    const topicMatch = trimmed.match(TOPIC_LINE);
    if (topicMatch && currentModule) {
      addTopic(currentModule, topicMatch[1], topicMatch[2], trimmed, ctx);
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_LINE);
    if (bulletMatch && currentModule && section === 'module_body') {
      addTopic(currentModule, null, bulletMatch[1], trimmed, ctx);
      continue;
    }

    if (currentModule && section === 'module_body' && trimmed && !trimmed.startsWith('#')) {
      const plainNum = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (plainNum) {
        addTopic(currentModule, plainNum[1], plainNum[2], trimmed, ctx);
        continue;
      }
    }

    if (
      !currentModule &&
      currentSubject &&
      /^INDUSTRIAL RELATIONS:/i.test(trimmed) &&
      !trimmed.match(MODULE_INLINE)
    ) {
      currentModule = ensureModule(currentSubject, 1, trimmed);
      section = 'module_body';
      continue;
    }

    if (/^OBJECTIVES:/i.test(trimmed) && currentSubject && !currentSubject.objectives) {
      section = 'objectives';
      sectionBuffer = [trimmed.replace(/^OBJECTIVES:\s*/i, '')];
      continue;
    }

    if (/^\.?\s*COURSE OUTCOMES:/i.test(trimmed) && currentSubject) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'outcomes';
      sectionBuffer = [trimmed.replace(/^\.?\s*COURSE OUTCOMES:\s*/i, '')];
      continue;
    }

    if (/^Suggested Books:/i.test(trimmed) && currentSubject) {
      flushSectionBuffer(currentSubject, section, sectionBuffer);
      section = 'readings';
      sectionBuffer = [];
      continue;
    }
  }

  flushSectionBuffer(currentSubject, section, sectionBuffer);

  for (const id of subjectOrder) {
    const s = subjects[id];
    if (!s.modules.length) {
      warnings.push({ type: 'no_modules', subjectId: id, title: s.title });
    }
    if (!Object.keys(s.semesterMap).length) {
      warnings.push({ type: 'no_semester', subjectId: id, title: s.title });
    }
  }

  return { subjects, subjectOrder, warnings };
}
