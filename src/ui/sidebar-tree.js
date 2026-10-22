import { el, formatSemesterLabel } from '../utils/dom.js';
import { store, saveSidebarState } from '../state/store.js';
import { navigate, buildPath } from '../router/hash-router.js';
import {
  semesterIsExpandable,
  subjectIsExpandable,
  moduleIsExpandable,
  expandAriaLabel,
  moduleRowIsActive,
  moduleRowIsExpanded,
  moduleRowIsLockedOpen,
  semesterRowIsExpanded,
  subjectRowIsExpanded,
  topicRowIsActive,
} from './sidebar-tree-utils.js';

function chevronIcon(expanded) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tree-chevron-icon');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute(
    'd',
    expanded ? 'M5.5 8 L10 12.5 L14.5 8' : 'M8 5.5 L12.5 10 L8 14.5',
  );
  svg.appendChild(path);
  return svg;
}

function createChevronButton({ expanded, sectionLabel, onToggle }) {
  return el('button', {
    type: 'button',
    className: 'tree-chevron-btn',
    'aria-expanded': expanded ? 'true' : 'false',
    'aria-label': expandAriaLabel(expanded, sectionLabel),
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    },
  }, [chevronIcon(expanded)]);
}

function createTreeRow({
  level,
  active,
  mobile,
  expanded,
  expandable,
  sectionLabel,
  labelContent,
  onLabelClick,
  onToggleExpand,
}) {
  const row = el('div', {
    className: [
      'tree-row',
      `tree-row--${level}`,
      active ? 'is-active' : '',
      mobile ? 'tree-row--touch' : '',
    ]
      .filter(Boolean)
      .join(' '),
  });

  const labelBtn = el('button', {
    type: 'button',
    role: 'treeitem',
    className: 'tree-row-label',
    ...(expandable ? { 'aria-expanded': expanded ? 'true' : 'false' } : {}),
    onClick: onLabelClick,
  }, [].concat(labelContent));

  row.appendChild(labelBtn);

  if (expandable && onToggleExpand) {
    row.appendChild(
      createChevronButton({
        expanded,
        sectionLabel,
        onToggle: onToggleExpand,
      }),
    );
  }

  return row;
}

function subjectTitle(subject, mobile) {
  const title = subject.title || '';
  if (mobile || title.length <= 64) return title;
  return `${title.slice(0, 64)}…`;
}

function topicTitle(topic, mobile) {
  const title = topic.title || '';
  if (mobile || title.length <= 80) return title;
  return `${title.slice(0, 80)}…`;
}

export function renderSidebarTree(resolved, options = {}) {
  const mobile = Boolean(options.mobile);
  const navId = options.navId || (mobile ? 'sidebar-mobile' : 'sidebar');
  const root = el('nav', {
    id: navId,
    className: `sidebar-tree${mobile ? ' sidebar-tree--mobile' : ''}`,
    role: 'tree',
    'aria-label': 'Curriculum',
  });
  const programme = store.programme;
  const prog = store.curriculum.programmes.find((p) => p.id === programme);
  if (!prog) return root;

  if (!options.hideHeading) {
    root.appendChild(
      el('p', { className: 'sidebar-tree-heading' }, ['Curriculum']),
    );
  }

  const semesterList = el('div', { className: 'sidebar-tree-semesters', role: 'presentation' });

  for (const sem of prog.semesters) {
    const semKey = `${programme}:${sem}`;
    const subjects = prog.subjectsBySemester[sem] || [];
    const expanded = semesterRowIsExpanded(resolved, sem, store.sidebarExpanded[semKey]);
    const semActive = resolved?.semester === sem && !resolved?.subject;
    const semLabel = formatSemesterLabel(sem);
    const semExpandable = semesterIsExpandable(subjects);

    semesterList.appendChild(
      createTreeRow({
        level: 'semester',
        active: semActive,
        mobile,
        expanded,
        expandable: semExpandable,
        sectionLabel: semLabel,
        labelContent: [semLabel],
        onLabelClick: () => {
          navigate({ programme, semester: sem, subject: null, module: null, topic: null });
        },
        onToggleExpand: () => saveSidebarState(semKey, !expanded),
      }),
    );

    if (expanded && subjects.length) {
      const subList = el('div', {
        className: 'tree-group tree-group--subjects',
        role: 'group',
        'aria-label': `${semLabel} subjects`,
      });

      for (const slug of subjects) {
        const subject = store.curriculum.subjects[slug];
        if (!subject) continue;
        const subKey = `${programme}:${sem}:${slug}`;
        const subExp = subjectRowIsExpanded(resolved, slug, store.sidebarExpanded[subKey]);
        const subjectActive = resolved?.subject?.slug === slug && !resolved?.topic;
        const subExpandable = subjectIsExpandable(subject);
        const subjectLabel = subjectTitle(subject, mobile);

        subList.appendChild(
          createTreeRow({
            level: 'subject',
            active: subjectActive,
            mobile,
            expanded: subExp,
            expandable: subExpandable,
            sectionLabel: subjectLabel,
            labelContent: [
              subject.isElective
                ? el('span', { className: 'tree-elective-mark', 'aria-hidden': 'true' }, ['⚡ '])
                : null,
              subjectLabel,
            ],
            onLabelClick: () => {
              navigate({ programme, semester: sem, subject: slug, module: null, topic: null });
            },
            onToggleExpand: subExpandable
              ? () => saveSidebarState(subKey, !subExp)
              : null,
          }),
        );

        if (subExp && subject.modules.length) {
          const modList = el('div', {
            className: 'tree-group tree-group--modules',
            role: 'group',
            'aria-label': `Modules in ${subjectLabel}`,
          });

          for (const mod of subject.modules) {
            const modKey = `${subKey}:${mod.id}`;
            const modExp = moduleRowIsExpanded(
              resolved,
              slug,
              mod.id,
              store.sidebarExpanded[modKey],
            );
            const modActive = moduleRowIsActive(resolved, slug, mod.id);
            const modLocked = moduleRowIsLockedOpen(resolved, slug, mod.id);
            const modExpandable = moduleIsExpandable(mod) && !modLocked;
            const modTitle = mod.title?.trim() || '';
            const modLabel = modTitle
              ? `Module ${mod.number}: ${modTitle}`
              : `Module ${mod.number}`;

            modList.appendChild(
              createTreeRow({
                level: 'module',
                active: modActive,
                mobile,
                expanded: modExp,
                expandable: modExpandable,
                sectionLabel: modLabel,
                labelContent: [modLabel],
                onLabelClick: () => {
                  navigate({
                    programme,
                    semester: sem,
                    subject: slug,
                    module: mod.id,
                    topic: null,
                  });
                },
                onToggleExpand:
                  modExpandable && !modLocked
                    ? () => saveSidebarState(modKey, !modExp)
                    : null,
              }),
            );

            if (modExp && mod.topics.length) {
              const topicList = el('div', {
                className: 'tree-group tree-group--topics',
                role: 'group',
                'aria-label': `Topics in ${modLabel}`,
              });

              for (const topic of mod.topics.slice(0, 50)) {
                const topicActive = topicRowIsActive(resolved, slug, mod.id, topic.id);
                topicList.appendChild(
                  el('a', {
                    href: buildPath({
                      programme,
                      semester: sem,
                      subject: slug,
                      module: mod.id,
                      topic: topic.id,
                    }),
                    role: 'treeitem',
                    className: `tree-topic${topicActive ? ' is-active' : ''}`,
                  }, [topicTitle(topic, mobile)]),
                );
              }
              modList.appendChild(topicList);
            }
          }
          subList.appendChild(modList);
        }

      }
      semesterList.appendChild(subList);
    }
  }

  root.appendChild(semesterList);
  return root;
}
