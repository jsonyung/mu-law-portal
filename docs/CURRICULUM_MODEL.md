# Curriculum data model

How the Mumbai LL.B. syllabus flows from the official markdown into the portal (3-Year, 5-Year, all semesters, modules, and topics).

## Pipeline

```text
university_mumbai_llb_master_curriculum.md   ← edit syllabus text
content/enrichment/topics/*.json             ← optional per-topic study notes
data/overrides/*.json                        ← slugs, themes, aliases, module titles
        ↓  npm run build:curriculum
data/generated/curriculum.json               ← commit to git
data/generated/search-index.json
data/generated/parse-report.json
        ↓  copy to public/data (dev) + npm run build → docs/ (Pages)
Browser hash routes
```

Do **not** hand-edit `public/data/` or `docs/data/` — they are regenerated copies.

## Programmes and semesters

| Programme ID | Semesters | Typical student path |
|--------------|-----------|----------------------|
| `llb-3yr` | `sem-1` … `sem-6` | Law papers from Semester I |
| `llb-5yr` | `sem-1` … `sem-10` | Foundation (I–IV), then law papers |

The app builds each programme’s semester list from every subject’s `semesterMap` (see below). There is no separate semester table in the markdown.

### Dual semester headings (`## Semester: V/I`)

The PDF often lists one block for both programmes, e.g. **5-Year Sem V** and **3-Year Sem I** together. The parser ([`scripts/normalize-semester.mjs`](../scripts/normalize-semester.mjs)) maps Roman numerals and assigns:

- `semesterMap: { "llb-3yr": "sem-1", "llb-5yr": "sem-5" }` (example for V/I)

Shared papers are stored **once** in `subjects{}` and appear under both programmes in `programmes[].subjectsBySemester`.

## JSON shape (generated curriculum)

```text
meta                    schemaVersion, syllabusYear, generatedAt, source
programmes[]            llb-3yr | llb-5yr → semesters[], subjectsBySemester{ sem-N: [slug, ...] }
subjectOrder[]          stable ordering of subject ids
subjects{ slug → … }    one record per paper
```

### Subject record

| Field | Source |
|-------|--------|
| `title`, `credits`, `courseCode` | Syllabus headings / metadata |
| `slug` / `id` | Parser + [`data/overrides/subject-slugs.json`](../data/overrides/subject-slugs.json) |
| `semesterMap` | Which sem each programme uses for this paper |
| `objectives`, `outcomes`, `readings[]` | Parser section buffers |
| `modules[]` | Module units inside the paper |
| `theme` | [`data/overrides/subject-themes.json`](../data/overrides/subject-themes.json) |

### Module and topic

| Field | Meaning |
|-------|---------|
| `module.id` | `module-1`, `module-2`, … (URL segment, not display title) |
| `module.title` | From PDF line after `Module N`, or [`module-titles.json`](../data/overrides/module-titles.json) if empty |
| `topic.id` | Stable slug from topic title (URL + enrichment filename) |
| `topic.sectionRef` | e.g. `1.1`, `2.3` |
| `topic.syllabusText` | Prescribed line from syllabus |
| `topic.enrichment` | Merged from `content/enrichment/topics/<topicId>.json` |

## URL pattern

```text
#/llb-3yr/sem-1/labour-law-industrial-relations-1/module-1/trade-union-definition-registration-and-recognition
   programme   semester   subject slug                      module id    topic id
```

Search index documents include routes for every programme a subject belongs to.

## Markdown → parser (why module titles differ)

The university PDF is inconsistent:

| Pattern | Example |
|---------|---------|
| Title on same line | `Module : 1: INDUSTRIAL RELATIONS CODE` |
| Title on next line | `#### MODULE 1:` then `General Principles of Tort` |
| Section scope as title | `Sections 1 – 9 … Indian Contract Act 1872` |
| No title line | Module 4 jumps straight to `4.1 …` topics |

[`state-machine-parser.mjs`](../scripts/lib/state-machine-parser.mjs) picks up many next-line titles automatically. Gaps are filled via [`data/overrides/module-titles.json`](../data/overrides/module-titles.json) (only when `module.title` is still empty after parse).

## Overrides

| File | Purpose |
|------|---------|
| `subject-slugs.json` | Fix auto-generated slugs |
| `subject-themes.json` | UI accent colours |
| `legal-aliases.json` | Search synonyms (IPC, BNS, …) |
| `module-titles.json` | Display titles missing from PDF layout |

## Enrichment (not in raw syllabus)

One file per topic: `content/enrichment/topics/<topicId>.json`. Fields: `definition`, `statutoryReferences`, `cases`, `examChecklist`, `lastVerified`. Run `npm run enrich:scaffold -- --topic <id> --subject <slug>` then `npm run build:curriculum`.

## 3-Year student UX

- Use the **3-Year LL.B.** switcher; URLs stay under `#/llb-3yr/...`.
- Sidebar shows only that programme’s tree (no repeated “Also in 5-Year” rows).
- Shared papers: optional **“Also offered in another programme”** on the subject page header (collapsed).

## Sidebar expansion (curriculum tree)

| Control | Action |
|---------|--------|
| **Row label** | Navigates (subject / module / semester page) |
| **Chevron** | Expands or collapses children only; state saved in `localStorage` key `mu-law-sidebar` |

**Key shape:** `{programme}:{sem}` → `{programme}:{sem}:{subjectSlug}` → `{programme}:{sem}:{subjectSlug}:{moduleId}`.

**Rules:**

1. Explicit `true` / `false` in storage wins over defaults (you can collapse Torts while reading Labour).
2. On **navigation**, missing keys on the route path are set to `true`; existing `false` is not overwritten.
3. The **module that contains the current topic** stays open (no chevron); topics remain visible and highlighted.
4. Navigating to a subject **collapses sibling subjects** in that semester (accordion) to reduce noise.
5. **Viewport:** sticky sidebar from **1024px (`lg`)** up; below that, use the **menu** drawer (e.g. narrow Chrome with a side panel).

See [SIDEBAR_REGRESSION.md](SIDEBAR_REGRESSION.md) for manual checks.

## Maintainer workflow

1. Edit markdown and/or enrichment/overrides.
2. `npm run build:curriculum`
3. `npm run validate:curriculum` (runs automatically at end of parse)
4. `npm test` and `npm run build`
5. Commit `data/generated/` (+ source changes)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for CI and smoke checks.

## Future (not in this model)

- Normalizing the entire MD to one module heading style
- Heuristic module titles from first topic when PDF is silent (prefer overrides)
- Splitting objectives/readings PDF blobs in the parser
