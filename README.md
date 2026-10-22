# MU Law Portal

Interactive, color-coded study portal for University of Mumbai LL.B. (3-Year and 5-Year Integrated) CBCS syllabus (2022–23), deployable to GitHub Pages.

## Local development

```bash
npm install
npm run build:curriculum   # parse university_mumbai_llb_master_curriculum.md → JSON
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173/mu-law-portal/`).

## Build for GitHub Pages

```bash
npm run build
```

Output is written to `docs/` for the GitHub Actions workflow.

## Curriculum source

Edit [`university_mumbai_llb_master_curriculum.md`](university_mumbai_llb_master_curriculum.md), then run `npm run build:curriculum`.

## Enrichment notes

One JSON file per topic under [`content/enrichment/topics/`](content/enrichment/topics/). Re-run `npm run build:curriculum` to merge into `data/generated/curriculum.json`.

| Field | Purpose |
|-------|---------|
| `topicId` | Must match curriculum topic `id` |
| `definition` | Short concept summary (shown on topic study page) |
| `statutoryReferences` | `{ act, sections[], note? }` |
| `cases` | `{ name, citation?, court?, proposition? }` |
| `examChecklist` | `{ id, text }` checklist items |
| `lastVerified` | ISO date string |

Scaffold a new file:

```bash
npm run enrich:scaffold -- --topic <topicId> --subject <subject-slug>
```

## Generated data

- **Source of truth (git):** [`data/generated/`](data/generated/) — curriculum, search index, parse report.
- **`public/data/`** and **`docs/data/`** are build copies (gitignored); created by `npm run build:curriculum` and Vite.

See [CONTRIBUTING.md](CONTRIBUTING.md) for PR checks.

## Deep links

Hash routes follow:

`#/llb-3yr/sem-1/{subject-slug}/module-1/{topic-slug}`
