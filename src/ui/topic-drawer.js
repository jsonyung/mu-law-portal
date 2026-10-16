import { el } from '../utils/dom.js';
import { renderStudyCards } from './study-cards.js';
import { navigate } from '../router/hash-router.js';

export function renderTopicDrawer(ctx, onCheckChange) {
  const { programme, semester, subject, module, topic } = ctx;
  const overlay = el('div', {
    className: 'topic-drawer-overlay fixed inset-0 z-40 bg-black/40 md:bg-transparent md:pointer-events-none',
    onClick: (e) => {
      if (e.target === overlay) {
        navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null });
      }
    },
  });

  const panel = el('aside', {
    className:
      'fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto pointer-events-auto border-l dark:border-slate-700',
    role: 'dialog',
    'aria-labelledby': 'topic-drawer-title',
  });

  panel.appendChild(
    el('div', { className: 'sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b dark:border-slate-700 p-4 flex items-start justify-between gap-2' }, [
      el('div', {}, [
        el('p', { className: 'text-xs uppercase text-slate-500' }, [module.title || module.id]),
        el('h2', { id: 'topic-drawer-title', className: 'font-serif text-lg font-bold' }, [topic.title]),
      ]),
      el('button', {
        type: 'button',
        className: 'rounded-lg px-3 py-1 text-sm border dark:border-slate-600',
        onClick: () => navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null }),
      }, ['Close']),
    ]),
  );

  const body = el('div', { className: 'p-4 subject-themed', style: `--subject-hue: ${subject.theme?.hue ?? 220}` });
  body.appendChild(renderStudyCards(ctx, onCheckChange));
  panel.appendChild(body);

  overlay.appendChild(panel);
  return overlay;
}
