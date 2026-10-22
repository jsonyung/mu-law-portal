# Sidebar / curriculum drawer regression

Check at **390px** (phone) and **1280px** (desktop). Also spot-check **~1100px** (split window with browser side panel).

## Layout

| Width | Expected |
|-------|----------|
| ≥1024px | Sticky left curriculum tree; no hamburger |
| &lt;1024px | Hamburger opens off-canvas drawer; backdrop + Escape closes |

## Expansion (3-Year Sem I)

1. Open a **Labour Law** topic. Collapse **Law of Torts** / **Legal Language** chevrons → they stay collapsed.
2. Expand **Labour Module 2** while on a **Module 1** topic → Module 1 topic stays highlighted; scroll shows active topic on navigation.
3. Active module row has **no chevron** (topic list locked open).
4. Chevron toggles on another subject do **not** jump sidebar scroll to top.

## Navigation accordion

1. From Torts, navigate to **Contract** (label or topic link) → Torts tree collapses; Contract path opens.

## Mobile drawer

1. Open menu → toggle chevrons → close with backdrop and Escape → body scroll restored.
