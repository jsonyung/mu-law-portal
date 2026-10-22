import { el, formatSemesterLabel } from '../utils/dom.js';
import { navigate } from '../router/hash-router.js';

export function renderBreadcrumbs(resolved) {
  const items = [];
  const { programme, semester, subject, module, topic, route } = resolved;

  items.push(crumb('Home', () => navigate({ programme, semester: null, subject: null, module: null, topic: null })));
  items.push(
    crumb(formatSemesterLabel(semester || route?.semester || 'sem-1'), () =>
      navigate({ programme, semester, subject: null, module: null, topic: null }),
    ),
  );

  if (subject) {
    items.push(
      crumb(subject.title.length > 48 ? `${subject.title.slice(0, 48)}…` : subject.title, () =>
        navigate({ programme, semester, subject: subject.slug, module: null, topic: null }),
      ),
    );
  }
  if (module) {
    items.push(
      crumb(module.title || module.id, () =>
        navigate({ programme, semester, subject: subject.slug, module: module.id, topic: null }),
      ),
    );
  }
  if (topic) {
    items.push(crumb(topic.title.length > 40 ? `${topic.title.slice(0, 40)}…` : topic.title, null));
  }

  return el(
    'nav',
    {
      className: 'flex flex-wrap items-center gap-1.5 text-xs mb-5 px-3 py-2 rounded-lg border',
      style: 'color: hsl(var(--text-secondary)); border-color: hsl(var(--border-subtle)); background: hsl(var(--surface-muted) / 0.5)',
      'aria-label': 'Breadcrumb',
    },
    items.flatMap((c, i) =>
      i ? [el('span', { className: 'opacity-40', 'aria-hidden': 'true' }, ['/']), c] : [c],
    ),
  );
}

function crumb(label, onClick) {
  if (!onClick) {
    return el('span', { className: 'font-medium', style: 'color: hsl(var(--text-primary))' }, [label]);
  }
  return el('button', {
    type: 'button',
    className: 'hover:underline underline-offset-2 rounded-sm',
    style: 'color: hsl(var(--brand-indigo))',
    onClick,
  }, [label]);
}
