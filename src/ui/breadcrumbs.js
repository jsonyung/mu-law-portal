import { el, formatSemesterLabel } from '../utils/dom.js';
import { navigate } from '../router/hash-router.js';

export function renderBreadcrumbs(resolved) {
  const items = [];
  const { programme, semester, subject, module, topic, route } = resolved;

  items.push(crumb('MU Law Portal', () => navigate({ programme, semester: null, subject: null, module: null, topic: null })));
  items.push(
    crumb(formatSemesterLabel(semester || route?.semester || 'sem-1'), () =>
      navigate({ programme, semester, subject: null, module: null, topic: null }),
    ),
  );

  if (subject) {
    items.push(
      crumb(subject.title.slice(0, 48), () =>
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
    items.push(crumb(topic.title.slice(0, 40), null));
  }

  return el(
    'nav',
    { className: 'flex flex-wrap items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-4', 'aria-label': 'Breadcrumb' },
    items.flatMap((c, i) => (i ? [el('span', { 'aria-hidden': 'true' }, [' / ']), c] : [c])),
  );
}

function crumb(label, onClick) {
  if (!onClick) return el('span', { className: 'font-medium text-slate-800 dark:text-slate-200' }, [label]);
  return el(
    'button',
    {
      type: 'button',
      className: 'hover:text-indigo-600 dark:hover:text-indigo-400 underline-offset-2 hover:underline',
      onClick,
    },
    [label],
  );
}
