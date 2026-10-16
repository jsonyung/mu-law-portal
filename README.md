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

Add per-topic doctrinal content under [`content/enrichment/topics/`](content/enrichment/topics/) as JSON (see sample file). Re-run `npm run build:curriculum` to merge.

## Deep links

Hash routes follow:

`#/llb-3yr/sem-1/{subject-slug}/module-1/{topic-slug}`
