import { el, markdownLite, formatReadingLine, formatSemesterLabel } from '../utils/dom.js';
import { normalizeReadingList } from '../utils/normalize-readings.js';
import { navigate, buildPath } from '../router/hash-router.js';
import { setProgramme } from '../state/store.js';

export function renderSubjectView(ctx) {
  const { programme, semester, subject, topic, module: activeModule } = ctx;
  const hue = subject.theme?.hue ?? 220;
  const wrap = el('article', {
    className: 'subject-themed w-full min-w-0 max-w-4xl',
    style: `--subject-hue: ${hue}`,
  });

  wrap.appendChild(
    el('header', {
      className: 'rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg',
      style: `background: linear-gradient(135deg, hsl(${hue} 52% 36%), hsl(${hue} 45% 22%))`,
    }, [
      el('p', { className: 'text-xs uppercase tracking-widest opacity-85 mb-2 font-medium' }, [
        subject.isElective ? 'Elective course' : 'Core paper',
        subject.credits ? ` · ${subject.credits} credits` : '',
      ]),
      el('h1', { className: 'font-serif text-2xl md:text-3xl font-bold leading-tight' }, [subject.title]),
      alternateProgrammeDetails(subject, programme, semester),
    ]),
  );

  if (subject.objectives) {
    wrap.appendChild(sectionBlock('Course objectives', subject.objectives));
  }
  if (subject.outcomes) {
    wrap.appendChild(sectionBlock('Course outcomes', subject.outcomes));
  }

  const readings = normalizeReadingList(subject.readings || []);
  if (readings.length) {
    const readingsSec = el('section', {
      id: 'subject-readings',
      className: 'mb-8 study-card card-reading',
    });
    readingsSec.appendChild(
      el('h2', { className: 'font-serif font-semibold text-lg mb-1' }, ['Syllabus bibliography']),
    );
    readingsSec.appendChild(
      el('p', { className: 'text-xs mb-4', style: 'color: hsl(var(--text-muted))' }, [
        'Prescribed and suggested readings from the official syllabus PDF. Verify editions for your batch.',
      ]),
    );
    readingsSec.appendChild(
      el(
        'ol',
        { className: 'space-y-2.5 text-sm leading-relaxed list-decimal pl-5' },
        readings.map((r, idx) => {
          const line = formatReadingLine(r);
          return el(
            'li',
            {
              id: `reading-${subject.slug}-${idx + 1}`,
              className: 'scroll-mt-28 pl-1',
              style: 'color: hsl(var(--text-primary))',
            },
            [line || r],
          );
        }),
      ),
    );
    wrap.appendChild(readingsSec);
  }

  for (const mod of subject.modules) {
    const modEl = el('section', {
      className: 'mb-8 rounded-2xl border p-5 md:p-6 dark:bg-slate-900/50',
      style: `background: hsl(${hue} 40% 97% / 0.55); border-color: hsl(var(--border-subtle))`,
      id: mod.id,
    });

    const modTitle = mod.title?.trim()
      ? `Module ${mod.number}: ${mod.title}`
      : `Module ${mod.number}`;

    modEl.appendChild(el('h2', { className: 'font-serif text-lg font-semibold mb-4' }, [modTitle]));

    const list = el('ul', { className: 'space-y-3' });
    for (const t of mod.topics) {
      const isActive = topic?.id === t.id && activeModule?.id === mod.id;
      const li = el('li', {
        id: `topic-${t.id}`,
        className: 'rounded-xl border p-4 transition-shadow',
        style: isActive
          ? 'border-color: hsl(var(--brand-indigo) / 0.4); background: hsl(var(--surface-elevated)); box-shadow: var(--shadow-soft)'
          : 'border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-elevated))',
      });

      const link = buildPath({ programme, semester, subject: subject.slug, module: mod.id, topic: t.id });
      li.appendChild(
        el('div', { className: 'flex flex-wrap items-start justify-between gap-3' }, [
          el('a', {
            href: link,
            className: 'font-medium flex-1 hover:underline underline-offset-2',
            style: 'color: hsl(var(--brand-indigo))',
            onClick: (e) => {
              e.preventDefault();
              navigate({ programme, semester, subject: subject.slug, module: mod.id, topic: t.id });
            },
          }, [t.sectionRef ? `${t.sectionRef}. ` : '', t.title]),
          el('button', {
            type: 'button',
            className: 'no-print text-xs min-h-11 px-3 py-2 rounded-lg border transition-colors shrink-0',
            style: 'border-color: hsl(var(--border-subtle)); color: hsl(var(--text-muted))',
            title: 'Copy deep link',
            onClick: () => {
              const url = `${location.origin}${location.pathname}${link}`;
              navigator.clipboard?.writeText(url);
            },
          }, ['Copy link']),
        ]),
      );
      if (t.syllabusText) {
        li.appendChild(
          el('p', { className: 'text-sm mt-2 line-clamp-3', style: 'color: hsl(var(--text-secondary))' }, [
            t.syllabusText,
          ]),
        );
      }
      list.appendChild(li);
    }
    modEl.appendChild(list);
    wrap.appendChild(modEl);
  }

  return wrap;
}

function alternateProgrammeDetails(subject, programme, semester) {
  const altEntry = Object.entries(subject.semesterMap || {}).find(([p]) => p !== programme);
  if (!altEntry) return null;
  const [altProg, altSem] = altEntry;
  const altLabel = altProg === 'llb-3yr' ? '3-Year LL.B.' : '5-Year BLS LL.B.';

  return el('details', { className: 'mt-4 text-xs opacity-90 max-w-xl' }, [
    el('summary', {
      className: 'cursor-pointer select-none underline-offset-2 hover:underline',
    }, ['Also offered in another programme']),
    el('p', { className: 'mt-2 leading-relaxed' }, [
      `This paper is also listed under ${altLabel}, ${formatSemesterLabel(altSem)}. `,
      el('button', {
        type: 'button',
        className: 'font-semibold underline underline-offset-2',
        onClick: () => {
          setProgramme(altProg);
          navigate({
            programme: altProg,
            semester: altSem,
            subject: subject.slug,
            module: null,
            topic: null,
          });
        },
      }, [`Open in ${altLabel}`]),
      '.',
    ]),
  ]);
}

function sectionBlock(title, text) {
  return el('section', { className: 'mb-6 study-card card-syllabus' }, [
    el('h2', { className: 'font-serif font-semibold text-lg mb-3' }, [title]),
    el('div', { className: 'text-sm leading-relaxed prose-muted', style: 'color: hsl(var(--text-secondary))', innerHTML: markdownLite(text) }),
  ]);
}
