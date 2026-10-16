import { el, markdownLite } from '../utils/dom.js';
import { navigate, buildPath } from '../router/hash-router.js';

export function renderSubjectView(ctx) {
  const { programme, semester, subject, module, topic } = ctx;
  const hue = subject.theme?.hue ?? 220;
  const wrap = el('article', {
    className: 'subject-themed',
    style: `--subject-hue: ${hue}`,
  });

  wrap.appendChild(
    el('header', { className: 'rounded-2xl p-6 mb-6 text-white', style: `background: linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${hue} 45% 28%))` }, [
      el('p', { className: 'text-xs uppercase tracking-widest opacity-80 mb-1' }, [
        subject.isElective ? 'Elective' : 'Core Paper',
        subject.credits ? ` · ${subject.credits} Credits` : '',
      ]),
      el('h1', { className: 'font-serif text-2xl md:text-3xl font-bold leading-tight' }, [subject.title]),
    ]),
  );

  if (subject.objectives) {
    wrap.appendChild(sectionBlock('Course Objectives', subject.objectives));
  }
  if (subject.outcomes) {
    wrap.appendChild(sectionBlock('Course Outcomes', subject.outcomes));
  }

  if (subject.readings?.length) {
    const readingsSec = el('section', {
      id: 'subject-readings',
      className: 'mb-8 study-card card-reading',
    });
    readingsSec.appendChild(el('h2', { className: 'font-semibold mb-3' }, ['Recommended Readings']));
    readingsSec.appendChild(
      el(
        'ul',
        { className: 'list-disc pl-5 space-y-2 text-sm' },
        subject.readings.map((r, idx) =>
          el(
            'li',
            {
              id: `reading-${subject.slug}-${idx + 1}`,
              className: 'scroll-mt-24 rounded px-1 -mx-1',
            },
            [r],
          ),
        ),
      ),
    );
    wrap.appendChild(readingsSec);
  }

  for (const mod of subject.modules) {
    const modEl = el('section', {
      className: 'mb-8 rounded-xl border p-4 dark:border-slate-700',
      style: `background: hsl(${hue} 45% 96% / 0.5)`,
      id: mod.id,
    });

    modEl.appendChild(
      el('h2', { className: 'font-serif text-lg font-semibold mb-3' }, [
        `Module ${mod.number}: ${mod.title || ''}`,
      ]),
    );

    const list = el('ul', { className: 'space-y-2' });
    for (const t of mod.topics) {
      const li = el('li', {
        id: `topic-${t.id}`,
        className: 'rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700 p-3 transition-shadow',
      });

      const link = buildPath({ programme, semester, subject: subject.slug, module: mod.id, topic: t.id });
      li.appendChild(
        el('div', { className: 'flex flex-wrap items-start justify-between gap-2' }, [
          el('a', {
            href: link,
            className: 'font-medium text-indigo-700 dark:text-indigo-300 hover:underline flex-1',
            onClick: (e) => {
              e.preventDefault();
              navigate({ programme, semester, subject: subject.slug, module: mod.id, topic: t.id });
            },
          }, [t.sectionRef ? `${t.sectionRef}. ` : '', t.title]),
          el('button', {
            type: 'button',
            className: 'no-print text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800',
            title: 'Copy deep link',
            onClick: () => {
              const url = `${location.origin}${location.pathname}${link}`;
              navigator.clipboard?.writeText(url);
            },
          }, ['Copy link']),
        ]),
      );
      li.appendChild(el('p', { className: 'text-sm mt-1 opacity-80 line-clamp-2' }, [t.syllabusText || '']));
      list.appendChild(li);
    }
    modEl.appendChild(list);
    wrap.appendChild(modEl);
  }

  return wrap;
}

function sectionBlock(title, text) {
  return el('section', { className: 'mb-6 study-card card-syllabus' }, [
    el('h2', { className: 'font-semibold mb-2' }, [title]),
    el('div', { className: 'text-sm', innerHTML: markdownLite(text) }),
  ]);
}
