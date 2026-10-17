import { el } from '../utils/dom.js';
import { store } from '../state/store.js';

export function renderFooter() {
  const year = store.curriculum?.meta?.syllabusYear || null;

  return el('footer', {
    className: 'mt-auto border-t no-print',
    style: 'border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-elevated))',
    role: 'contentinfo',
  }, [
    el('div', { className: 'max-w-content mx-auto px-4 py-10 md:py-12 safe-bottom w-full min-w-0' }, [
      el('div', { className: 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' }, [
        el('div', { className: 'space-y-3' }, [
          el('p', { className: 'font-serif text-lg font-bold text-brand-navy dark:text-slate-50' }, ['MU Law Portal']),
          el('p', { className: 'text-sm leading-relaxed', style: 'color: hsl(var(--text-secondary))' }, [
            'An independent digital study companion for the University of Mumbai LL.B. syllabus (CBCS). ',
            'This site is not affiliated with, operated by, or endorsed by the University of Mumbai unless separately authorized.',
          ]),
        ]),
        el('div', { className: 'space-y-3' }, [
          el('h2', { className: 'text-xs font-semibold uppercase tracking-wider', style: 'color: hsl(var(--text-muted))' }, [
            'Syllabus source',
          ]),
          el('p', { className: 'text-sm leading-relaxed', style: 'color: hsl(var(--text-secondary))' }, [
            'Structured from the Mumbai University master LL.B. curriculum document',
            year ? ` (${year} cycle).` : ' (2022–23 CBCS where noted).',
            ' Programme structure, subjects, and module outlines follow that published syllabus.',
          ]),
        ]),
        el('div', { className: 'space-y-3 md:col-span-2 lg:col-span-1' }, [
          el('h2', { className: 'text-xs font-semibold uppercase tracking-wider', style: 'color: hsl(var(--text-muted))' }, [
            'Before exams',
          ]),
          el('p', { className: 'text-sm leading-relaxed', style: 'color: hsl(var(--text-secondary))' }, [
            'Verify current statutes, judicial developments, and the syllabus applicable to your batch. ',
            'Use this portal for navigation and study organization—not as a substitute for official notifications or faculty guidance.',
          ]),
        ]),
      ]),
      el('p', {
        className: 'mt-8 pt-6 border-t text-xs text-center',
        style: 'border-color: hsl(var(--border-subtle)); color: hsl(var(--text-muted))',
      }, [`© ${new Date().getFullYear()} MU Law Portal · Educational resource only`]),
    ]),
  ]);
}
