export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function formatSemesterLabel(semId) {
  const n = parseInt(semId.replace('sem-', ''), 10);
  const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return `Semester ${romans[n] || n}`;
}

/** Display cleanup for syllabus reading lines (leading dot artifacts from source). */
export function formatReadingLine(text) {
  if (!text) return '';
  let s = String(text).trim();
  if (/^\.\s+/.test(s)) s = s.replace(/^\.\s+/, '');
  return s;
}

export function programmeShortLabel(progId) {
  if (progId === 'llb-5yr') return '5-Year BLS LL.B.';
  return '3-Year LL.B.';
}

export function programmeDescription(prog) {
  if (!prog) return '';
  const count = prog.semesters?.length ?? 0;
  const last = prog.semesters?.[count - 1];
  const lastLabel = last ? formatSemesterLabel(last).replace('Semester ', '') : '';
  if (prog.id === 'llb-5yr') {
    return `Integrated programme · Semesters I–${lastLabel || 'X'} (${count} semesters)`;
  }
  return `Graduate LL.B. · Semesters I–${lastLabel || 'VI'} (${count} semesters)`;
}

export function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

export function markdownLite(text) {
  if (!text) return '';
  return escapeHtml(text)
    .split(/\n\n+/)
    .map((p) => `<p class="mb-2 last:mb-0">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}
