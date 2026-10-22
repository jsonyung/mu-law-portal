# Contributing

## Before opening a PR

1. `npm run build:curriculum` — parse syllabus and regenerate `data/generated/`
2. `npm run validate:curriculum` — schema and parse-report checks
3. `npm test`
4. `npm run build` — production bundle to `docs/`

## Manual smoke (search + navigation)

See [SEARCH_REGRESSION.md](SEARCH_REGRESSION.md). Check at **390px** and **1280px** width.

## Data layout

| Path | Role |
|------|------|
| `university_mumbai_llb_master_curriculum.md` | Source syllabus |
| `docs/CURRICULUM_MODEL.md` | Data model (3yr/5yr, sem, module, topic, URLs) |
| `content/enrichment/topics/*.json` | Optional per-topic notes (merged at build) |
| `data/overrides/*.json` | Slugs, themes, search aliases, module titles |
| `data/generated/` | **Committed** curriculum + search index + parse report |
| `public/data/` | Dev copy (gitignored; created by parse) |
| `docs/data/` | Pages build copy (gitignored; created by Vite from `public/`) |

## Enrichment

```bash
npm run enrich:scaffold -- --topic <topicId> [--subject <subject-slug>]
npm run build:curriculum
```

Topic JSON fields: `topicId`, `definition`, `statutoryReferences`, `cases`, `examChecklist`, `lastVerified`.
