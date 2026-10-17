import { el, programmeShortLabel } from '../utils/dom.js';
import { store, setProgramme } from '../state/store.js';
import { navigate } from '../router/hash-router.js';

/** Short visible label for mobile drawer buttons only. */
export function programmeCompactLabel(progId) {
  return progId === 'llb-5yr' ? '5-Year' : '3-Year';
}

export function renderProgrammeSwitcher(options = {}) {
  const variant = options.variant || 'header';
  const wrap = el('div', {
    className: variant === 'drawer' ? 'programme-switcher programme-switcher--drawer' : 'programme-switcher',
    role: 'group',
    'aria-label': 'Programme',
  });

  for (const prog of store.curriculum?.programmes || []) {
    const active = store.programme === prog.id;
    const visibleLabel =
      variant === 'drawer' ? programmeCompactLabel(prog.id) : programmeShortLabel(prog.id);
    wrap.appendChild(
      el('button', {
        type: 'button',
        className: `min-h-11 px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-medium rounded-lg transition-all leading-snug text-center lg:text-left lg:whitespace-nowrap ${
          variant === 'drawer' ? 'text-sm font-semibold py-2.5' : ''
        } ${active ? 'shadow-sm ring-1 ring-inset' : ''}`,
        style: active
          ? 'background: hsl(var(--brand-navy)); color: hsl(210 40% 98%); ring-color: hsl(var(--brand-indigo) / 0.35)'
          : 'color: hsl(var(--text-secondary))',
        'aria-pressed': active ? 'true' : 'false',
        'aria-label': programmeShortLabel(prog.id),
        onClick: () => {
          setProgramme(prog.id);
          navigate({ programme: prog.id, semester: null, subject: null, module: null, topic: null });
        },
      }, [visibleLabel]),
    );
  }

  return wrap;
}
