import { el } from '../utils/dom.js';
import { store } from '../state/store.js';

export function renderFooter(options = {}) {
  const variant = options.variant || 'compact';
  const year = store.curriculum?.meta?.syllabusYear;

  if (variant === 'full') {
    return el('footer', {
      className: 'mt-auto border-t no-print',
      style: 'border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-elevated))',
      role: 'contentinfo',
    }, [
      el('div', { className: 'max-w-content mx-auto px-4 py-8 md:py-10 safe-bottom w-full min-w-0' }, [
        el('div', { className: 'max-w-2xl space-y-3' }, [
          el('p', { className: 'font-serif text-lg font-bold text-brand-navy dark:text-slate-50' }, [
            'MU Law Portal',
          ]),
          el('p', { className: 'text-sm leading-relaxed', style: 'color: hsl(var(--text-secondary))' }, [
            'Independent LL.B. syllabus navigator for University of Mumbai (CBCS). Not affiliated with or endorsed by the University of Mumbai.',
            year ? ` Syllabus cycle: ${year}.` : '',
          ]),
          el('p', { className: 'text-xs', style: 'color: hsl(var(--text-muted))' }, [
            'Verify statutes, notifications, and your batch syllabus before exams.',
          ]),
        ]),
        el('p', {
          className: 'mt-6 pt-4 border-t text-xs',
          style: 'border-color: hsl(var(--border-subtle)); color: hsl(var(--text-muted))',
        }, [`© ${new Date().getFullYear()} MU Law Portal · Educational resource only`]),
      ]),
    ]);
  }

  return el('footer', {
    className: 'mt-auto border-t no-print site-footer-compact',
    style: 'border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-elevated))',
    role: 'contentinfo',
  }, [
    el('div', {
      className: 'max-w-content mx-auto px-4 py-4 safe-bottom w-full min-w-0 text-center text-xs leading-relaxed',
      style: 'color: hsl(var(--text-muted))',
    }, [
      'Independent syllabus resource — not official UoM. ',
      el('a', {
        href: `#/${store.programme || 'llb-3yr'}`,
        className: 'underline underline-offset-2',
        style: 'color: hsl(var(--text-secondary))',
      }, ['About']),
      ` · © ${new Date().getFullYear()} MU Law Portal`,
    ]),
  ]);
}
