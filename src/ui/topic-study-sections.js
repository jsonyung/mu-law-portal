import { el, markdownLite } from '../utils/dom.js';
import { isChecked, toggleCheck } from '../state/progress.js';
import { buildPath } from '../router/hash-router.js';

function section(title, children) {
  return el('section', { className: 'topic-study-section study-card mb-6' }, [
    el('h2', { className: 'font-serif font-semibold text-base mb-3', style: 'color: hsl(var(--text-primary))' }, [
      title,
    ]),
    el('div', { className: 'text-sm leading-relaxed space-y-3', style: 'color: hsl(var(--text-secondary))' }, children),
  ]);
}

export function renderTopicStudySections(ctx) {
  const { programme, semester, subject, module, topic } = ctx;
  const frag = document.createDocumentFragment();
  const syllabus = (topic.syllabusText || topic.title || '').trim();

  if (syllabus) {
    frag.appendChild(
      section('Syllabus scope', [
        el('div', { innerHTML: markdownLite(syllabus) }),
        topic.sectionRef
          ? el('p', { className: 'text-xs mt-2', style: 'color: hsl(var(--text-muted))' }, [
              `Section ${topic.sectionRef}`,
            ])
          : null,
      ]),
    );
  }

  const def = topic.enrichment?.definition?.trim();
  if (def) {
    frag.appendChild(section('Concept', [el('div', { innerHTML: markdownLite(def) })]));
  }

  const statutory = topic.enrichment?.statutory || [];
  const cases = topic.enrichment?.cases || [];
  if (statutory.length || cases.length) {
    const body = [];
    if (statutory.length) {
      body.push(
        el(
          'ul',
          { className: 'list-disc pl-5 space-y-1.5' },
          statutory.map((s) =>
            el('li', {}, [
              `${s.act}${s.sections?.length ? ` — ${s.sections.join(', ')}` : ''}${s.note ? ` (${s.note})` : ''}`,
            ]),
          ),
        ),
      );
    }
    if (cases.length) {
      body.push(
        el(
          'ul',
          { className: 'list-disc pl-5 space-y-2 mt-2' },
          cases.map((c) =>
            el('li', {}, [
              el('strong', { style: 'color: hsl(var(--text-primary))' }, [c.name]),
              ` (${[c.court, c.year].filter(Boolean).join(' ')}) — ${c.proposition || ''}`,
            ]),
          ),
        ),
      );
    }
    frag.appendChild(section('Statutes and cases', body));
  }

  const checklist = topic.enrichment?.examChecklist || [];
  if (checklist.length) {
    frag.appendChild(
      section(
        'Exam checklist',
        checklist.map((item) => {
          const checked = isChecked(topic.id, item.id);
          const label = el('span', {}, [item.text]);
          if (checked) label.className = 'line-through opacity-60';
          return el('label', { className: 'flex items-start gap-3 cursor-pointer py-1' }, [
            el('input', {
              type: 'checkbox',
              className: 'mt-1 rounded border-slate-400 min-h-4 min-w-4',
              checked: checked ? 'checked' : null,
              onChange: () => {
                toggleCheck(topic.id, item.id);
                const now = isChecked(topic.id, item.id);
                label.className = now ? 'line-through opacity-60' : '';
              },
            }),
            label,
          ]);
        }),
      ),
    );
  }

  const subjectReadingsAnchor = `${buildPath({
    programme,
    semester,
    subject: subject.slug,
    module: null,
    topic: null,
  })}#subject-readings`;

  frag.appendChild(
    el('p', { className: 'text-sm pt-2 border-t', style: 'border-color: hsl(var(--border-subtle)); color: hsl(var(--text-muted))' }, [
      'Recommended books and bare acts are listed on the ',
      el('a', {
        href: subjectReadingsAnchor,
        className: 'font-medium underline underline-offset-2',
        style: 'color: hsl(var(--brand-indigo))',
      }, ['subject page']),
      '.',
    ]),
  );

  if (topic.sourceStatus === 'supplementary') {
    frag.appendChild(
      el('p', { className: 'text-xs text-amber-800 dark:text-amber-400 mt-4' }, [
        'Supplementary notes — verify against bare acts and your batch syllabus.',
      ]),
    );
  }

  return frag;
}
