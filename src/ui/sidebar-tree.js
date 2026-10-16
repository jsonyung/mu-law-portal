import { el, formatSemesterLabel } from '../utils/dom.js';
import { store, saveSidebarState } from '../state/store.js';
import { navigate, buildPath } from '../router/hash-router.js';
import { subjectProgress } from '../state/progress.js';

export function renderSidebarTree(resolved) {
  const root = el('nav', { id: 'sidebar', className: 'text-sm', role: 'tree', 'aria-label': 'Curriculum' });
  const programme = store.programme;
  const prog = store.curriculum.programmes.find((p) => p.id === programme);
  if (!prog) return root;

  for (const sem of prog.semesters) {
    const semKey = `${programme}:${sem}`;
    const expanded = store.sidebarExpanded[semKey] ?? resolved?.semester === sem;
    const subjects = prog.subjectsBySemester[sem] || [];

    const semBtn = el('button', {
      type: 'button',
      role: 'treeitem',
      'aria-expanded': expanded ? 'true' : 'false',
      className: 'w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-left',
      onClick: () => {
        saveSidebarState(semKey, !expanded);
        navigate({ programme, semester: sem, subject: null, module: null, topic: null });
      },
    }, [
      formatSemesterLabel(sem),
      el('span', { className: 'text-xs opacity-50' }, [expanded ? '▼' : '▶']),
    ]);

    root.appendChild(semBtn);

    if (expanded) {
      const subList = el('div', { className: 'ml-2 border-l border-slate-200 dark:border-slate-700 pl-2 mb-2', role: 'group' });
      for (const slug of subjects) {
        const subject = store.curriculum.subjects[slug];
        if (!subject) continue;
        const subKey = `${programme}:${sem}:${slug}`;
        const subExp = store.sidebarExpanded[subKey] ?? resolved?.subject?.slug === slug;
        const pct = subjectProgress(subject);

        subList.appendChild(
          el('button', {
            type: 'button',
            role: 'treeitem',
            className: `w-full text-left px-2 py-1 rounded text-xs ${
              resolved?.subject?.slug === slug ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`,
            onClick: () => {
              saveSidebarState(subKey, !subExp);
              navigate({ programme, semester: sem, subject: slug, module: null, topic: null });
            },
          }, [
            subject.isElective ? '⚡ ' : '',
            subject.title.slice(0, 36),
            pct != null ? ` (${pct}%)` : '',
          ]),
        );

        if (subExp && subject.modules.length) {
          for (const mod of subject.modules) {
            const modKey = `${subKey}:${mod.id}`;
            const modExp = store.sidebarExpanded[modKey] ?? resolved?.module?.id === mod.id;
            subList.appendChild(
              el('button', {
                type: 'button',
                className: 'w-full text-left pl-4 py-0.5 text-[11px] opacity-80 hover:opacity-100',
                onClick: () => {
                  saveSidebarState(modKey, !modExp);
                  navigate({ programme, semester: sem, subject: slug, module: mod.id, topic: null });
                },
              }, [`${mod.id.replace('module-', 'M')}: ${(mod.title || '').slice(0, 28)}`]),
            );

            if (modExp) {
              for (const topic of mod.topics.slice(0, 50)) {
                subList.appendChild(
                  el('a', {
                    href: buildPath({ programme, semester: sem, subject: slug, module: mod.id, topic: topic.id }),
                    className: `block pl-6 py-0.5 text-[11px] truncate ${
                      resolved?.topic?.id === topic.id ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'opacity-70 hover:opacity-100'
                    }`,
                  }, [topic.title.slice(0, 40)]),
                );
              }
            }
          }
        }

        const altEntry = Object.entries(subject.semesterMap).find(([p]) => p !== programme);
        if (altEntry) {
          const altLabel = altEntry[0] === 'llb-3yr' ? '3-Year' : '5-Year';
          subList.appendChild(
            el('p', { className: 'pl-2 text-[10px] text-slate-500 italic' }, [
              `Cross-listed: ${altLabel} ${formatSemesterLabel(altEntry[1])}`,
            ]),
          );
        }
      }
      root.appendChild(subList);
    }
  }

  return root;
}
