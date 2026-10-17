import { el } from '../utils/dom.js';
import { renderStudyCards } from './study-cards.js';
import { navigate } from '../router/hash-router.js';

export function renderTopicDrawer(ctx, onCheckChange) {
  const { programme, semester, subject, module, topic } = ctx;
  const overlay = el('div', {
    className: 'topic-drawer-overlay fixed inset-0 z-[45] bg-black/50 sm:bg-black/30',
    onClick: (e) => {
      if (e.target === overlay) {
        navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null });
      }
    },
  });

  const panel = el('aside', {
    className:
      'fixed right-0 top-0 z-[46] h-[100dvh] w-full sm:max-w-lg overflow-y-auto overscroll-contain pointer-events-auto border-l shadow-2xl flex flex-col',
    style: 'background: hsl(var(--surface-elevated)); border-color: hsl(var(--border-subtle))',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'topic-drawer-title',
  });

  panel.appendChild(
    el('div', {
      className: 'sticky top-0 backdrop-blur-md border-b p-4 flex items-start justify-between gap-3 shrink-0 safe-top',
      style: 'background: hsl(var(--surface-elevated) / 0.95); border-color: hsl(var(--border-subtle))',
    }, [
      el('div', { className: 'min-w-0 flex-1' }, [
        el('p', { className: 'text-[10px] font-semibold uppercase tracking-wider mb-1', style: 'color: hsl(var(--text-muted))' }, [
          module.title?.trim() ? `Module ${module.number}` : module.id,
        ]),
        el('h2', {
          id: 'topic-drawer-title',
          className: 'font-serif text-lg sm:text-xl font-bold leading-snug break-words',
        }, [topic.title]),
      ]),
      el('button', {
        type: 'button',
        className: 'btn-ghost shrink-0 min-h-11 px-4',
        onClick: () => navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null }),
      }, ['Close']),
    ]),
  );

  const body = el('div', {
    className: 'p-4 sm:p-5 subject-themed pb-10 flex-1 min-h-0',
    style: `--subject-hue: ${subject.theme?.hue ?? 220}`,
  });
  body.appendChild(renderStudyCards(ctx, onCheckChange));
  panel.appendChild(body);

  overlay.appendChild(panel);
  return overlay;
}
