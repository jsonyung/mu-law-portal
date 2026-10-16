import { el } from '../utils/dom.js';
import { store, setProgramme } from '../state/store.js';
import { navigate } from '../router/hash-router.js';

export function renderProgrammeSwitcher() {
  const wrap = el('div', { className: 'flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900' });

  for (const prog of store.curriculum?.programmes || []) {
    const active = store.programme === prog.id;
    wrap.appendChild(
      el(
        'button',
        {
          type: 'button',
          className: `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            active
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`,
          onClick: () => {
            setProgramme(prog.id);
            navigate({ programme: prog.id, semester: null, subject: null, module: null, topic: null });
          },
        },
        [prog.id === 'llb-3yr' ? '3-Year LL.B.' : '5-Year BLS LL.B.'],
      ),
    );
  }

  return wrap;
}
