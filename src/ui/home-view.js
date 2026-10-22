import { el, formatSemesterLabel, programmeShortLabel, programmeDescription } from '../utils/dom.js';
import { store, setProgramme } from '../state/store.js';
import { navigate } from '../router/hash-router.js';

export function renderHome(programme) {
  const wrap = el('div', { className: 'w-full min-w-0 max-w-4xl space-y-8 sm:space-y-10 pb-8' });

  wrap.appendChild(
    el('section', { className: 'space-y-4' }, [
      el('p', {
        className: 'text-xs font-semibold uppercase tracking-widest',
        style: 'color: hsl(var(--brand-indigo))',
      }, ['University of Mumbai · LL.B. syllabus navigator']),
      el('h1', { className: 'font-serif text-3xl md:text-4xl font-bold tracking-tight leading-tight' }, [
        'Your digital study book',
      ]),
      el('p', { className: 'text-base md:text-lg leading-relaxed max-w-2xl', style: 'color: hsl(var(--text-secondary))' }, [
        'Browse semesters, subjects, and topics with deep links, global search, and a readable layout aligned to the CBCS curriculum—without replacing official university materials.',
      ]),
    ]),
  );

  wrap.appendChild(renderProgrammeCards(programme));
  wrap.appendChild(renderSemesterDashboard(programme));

  return wrap;
}

function renderProgrammeCards(activeId) {
  const section = el('section', { 'aria-labelledby': 'programme-select-heading' }, [
    el('h2', {
      id: 'programme-select-heading',
      className: 'text-sm font-semibold mb-4',
      style: 'color: hsl(var(--text-primary))',
    }, ['Choose programme']),
  ]);

  const grid = el('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' });

  for (const prog of store.curriculum.programmes) {
    const active = prog.id === activeId;
    grid.appendChild(
      el('button', {
        type: 'button',
        className: `programme-card w-full ${active ? 'is-active' : ''}`,
        'aria-pressed': active ? 'true' : 'false',
        onClick: () => {
          if (prog.id !== store.programme) {
            setProgramme(prog.id);
          }
          navigate({ programme: prog.id, semester: null, subject: null, module: null, topic: null });
        },
      }, [
        el('div', { className: 'flex items-start justify-between gap-3' }, [
          el('div', {}, [
            el('h3', { className: 'font-serif text-xl font-bold mb-1' }, [programmeShortLabel(prog.id)]),
            el('p', { className: 'text-sm', style: 'color: hsl(var(--text-secondary))' }, [programmeDescription(prog)]),
          ]),
          active
            ? el('span', {
                className: 'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-1',
                style: 'background: hsl(var(--brand-indigo) / 0.15); color: hsl(var(--brand-indigo))',
              }, ['Active'])
            : null,
        ]),
        el('p', { className: 'mt-4 text-xs', style: 'color: hsl(var(--text-muted))' }, [
          prog.title || '',
        ]),
      ]),
    );
  }

  section.appendChild(grid);
  return section;
}

function renderSemesterDashboard(programme) {
  const prog = store.curriculum.programmes.find((p) => p.id === programme);
  if (!prog) return el('div');

  const section = el('section', { 'aria-labelledby': 'semester-dash-heading' }, [
    el('div', { className: 'flex flex-wrap items-end justify-between gap-2 mb-4' }, [
      el('h2', { id: 'semester-dash-heading', className: 'font-serif text-xl font-bold' }, [
        `${programmeShortLabel(programme)} — semesters`,
      ]),
      el('p', { className: 'text-sm', style: 'color: hsl(var(--text-muted))' }, [
        `${prog.semesters.length} semesters · pick one to view subjects`,
      ]),
    ]),
  ]);

  const grid = el('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' });
  for (const sem of prog.semesters) {
    const count = (prog.subjectsBySemester[sem] || []).length;
    grid.appendChild(
      el('button', {
        type: 'button',
        className: 'semester-card',
        onClick: () => navigate({ programme, semester: sem, subject: null, module: null, topic: null }),
      }, [
        el('div', { className: 'font-semibold text-base' }, [formatSemesterLabel(sem)]),
        el('div', { className: 'text-sm mt-1', style: 'color: hsl(var(--text-muted))' }, [
          `${count} subject${count === 1 ? '' : 's'}`,
        ]),
      ]),
    );
  }

  section.appendChild(grid);
  return section;
}
