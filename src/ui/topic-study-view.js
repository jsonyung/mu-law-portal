import { el } from '../utils/dom.js';
import { navigate } from '../router/hash-router.js';
import { renderTopicStudySections } from './topic-study-sections.js';

export function renderTopicStudyView(ctx) {
  const { programme, semester, subject, module, topic } = ctx;
  const hue = subject.theme?.hue ?? 220;
  const modLabel = module.title?.trim()
    ? `Module ${module.number}: ${module.title}`
    : `Module ${module.number}`;

  const wrap = el('article', {
    className: 'topic-study-view w-full min-w-0 max-w-3xl pb-8 safe-bottom',
    style: `--subject-hue: ${hue}`,
  });

  const reviewStatus = topic.enrichment?.reviewStatus;
  if (reviewStatus === 'pending') {
    wrap.appendChild(
      el('p', {
        className:
          'mb-4 text-xs font-semibold uppercase tracking-wide rounded-lg border px-3 py-2 text-amber-900 bg-amber-50 border-amber-200 dark:text-amber-100 dark:bg-amber-950/50 dark:border-amber-800',
        role: 'status',
      }, ['Human review pending — study notes are draft; verify with bare acts before exams']),
    );
  }

  wrap.appendChild(
    el('header', { className: 'mb-6 space-y-3' }, [
      el('button', {
        type: 'button',
        className: 'text-sm font-medium min-h-11 px-0 -ml-1 rounded-lg',
        style: 'color: hsl(var(--brand-indigo))',
        onClick: () =>
          navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null }),
      }, [`← All topics in ${subject.title.length > 36 ? `${subject.title.slice(0, 36)}…` : subject.title}`]),
      el('p', { className: 'text-xs font-semibold uppercase tracking-wider', style: 'color: hsl(var(--text-muted))' }, [
        modLabel,
      ]),
      el('h1', {
        id: `topic-${topic.id}`,
        className: 'font-serif text-2xl md:text-3xl font-bold leading-snug break-words',
        style: 'color: hsl(var(--text-primary))',
      }, [topic.title]),
    ]),
  );

  wrap.appendChild(renderTopicStudySections(ctx));
  return wrap;
}
