import { el, markdownLite } from '../utils/dom.js';
import { isChecked, toggleCheck } from '../state/progress.js';

function card(title, icon, className, bodyChildren) {
  return el('section', { className: `study-card ${className} mb-4` }, [
    el('h3', { className: 'font-semibold text-sm uppercase tracking-wide mb-2 flex items-center gap-2' }, [
      el('span', { 'aria-hidden': 'true' }, [icon]),
      title,
    ]),
    el('div', { className: 'text-sm leading-relaxed' }, bodyChildren),
  ]);
}

export function renderStudyCards(ctx, onCheckChange) {
  const { subject, topic } = ctx;
  const frag = document.createDocumentFragment();

  frag.appendChild(
    card('Official Syllabus Scope', '📜', 'card-syllabus', [
      el('div', { innerHTML: markdownLite(topic.syllabusText || topic.title) }),
      topic.sectionRef
        ? el('p', { className: 'mt-2 text-xs opacity-70' }, [`Section ref: ${topic.sectionRef}`])
        : null,
    ]),
  );

  const def = topic.enrichment?.definition;
  frag.appendChild(
    card(
      'Core Definition & Concept Breakdown',
      '📌',
      'card-definition',
      def
        ? [el('div', { innerHTML: markdownLite(def) })]
        : [
            el('p', { className: 'italic opacity-70' }, [
              'Prescribed syllabus topic — add enriched notes in content/enrichment/topics/',
            ]),
          ],
    ),
  );

  const statutory = topic.enrichment?.statutory || [];
  const cases = topic.enrichment?.cases || [];
  const statBody = [];
  if (statutory.length) {
    statBody.push(
      el(
        'ul',
        { className: 'list-disc pl-5 space-y-1' },
        statutory.map((s) =>
          el('li', {}, [`${s.act}${s.sections?.length ? ` — ${s.sections.join(', ')}` : ''}${s.note ? ` (${s.note})` : ''}`]),
        ),
      ),
    );
  }
  if (cases.length) {
    statBody.push(
      el(
        'ul',
        { className: 'list-disc pl-5 space-y-2 mt-2' },
        cases.map((c) =>
          el('li', {}, [
            el('strong', {}, [c.name]),
            ` (${c.court || ''} ${c.year || ''}) — ${c.proposition || ''}`,
          ]),
        ),
      ),
    );
  }
  if (!statBody.length) {
    statBody.push(el('p', { className: 'italic opacity-70' }, ['Statutes and cases to be added in enrichment layer.']));
  }
  frag.appendChild(card('Statutory Provisions & Landmark Case Laws', '⚖️', 'card-statute', statBody));

  const checklist = topic.enrichment?.examChecklist || [];
  const examChildren = [];
  if (checklist.length) {
    examChildren.push(
      el(
        'ul',
        { className: 'space-y-2' },
        checklist.map((item) => {
          const checked = isChecked(topic.id, item.id);
          return el('li', { className: 'flex items-start gap-2' }, [
            el('input', {
              type: 'checkbox',
              className: 'mt-1 rounded border-slate-400',
              checked: checked ? 'checked' : null,
              onChange: () => {
                toggleCheck(topic.id, item.id);
                onCheckChange?.();
              },
            }),
            el('span', { className: checked ? 'line-through opacity-60' : '' }, [item.text]),
          ]);
        }),
      ),
    );
  } else {
    examChildren.push(
      el('p', { className: 'italic opacity-70 mb-2' }, ['Answer-writing checklist — enable via enrichment JSON.']),
      el('ul', { className: 'list-disc pl-5 text-xs opacity-80' }, [
        el('li', {}, ['State the legal rule / test']),
        el('li', {}, ['Apply to facts with sections and case names']),
        el('li', {}, ['Note exceptions and conclude']),
      ]),
    );
  }
  frag.appendChild(card('Exam Strategy & Answer-Writing Checklist', '💡', 'card-exam', examChildren));

  const readings = subject.readings || [];
  frag.appendChild(
    card(
      'Recommended Readings',
      '📚',
      'card-reading',
      readings.length
        ? [
            el(
              'ul',
              { className: 'list-disc pl-5 space-y-1 max-h-48 overflow-y-auto' },
              readings.slice(0, 12).map((r) => el('li', {}, [r])),
            ),
          ]
        : [el('p', { className: 'italic opacity-70' }, ['See syllabus PDF for readings.'])],
    ),
  );

  if (topic.sourceStatus === 'supplementary') {
    frag.appendChild(
      el('p', { className: 'text-xs text-amber-700 dark:text-amber-400' }, [
        'Contains supplementary enrichment — verify against bare acts and your batch syllabus.',
      ]),
    );
  }

  return frag;
}
