/** Small inline SVG icons for header controls (currentColor). */

function svgIcon(className, paths, viewBox = '0 0 24 24') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of [].concat(paths)) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

export function iconSearch() {
  return svgIcon('icon-search', [
    'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z',
    'M16.5 16.5 21 21',
  ]);
}

export function iconMenu() {
  return svgIcon('icon-menu', ['M4 7h16', 'M4 12h16', 'M4 17h16']);
}

export function iconClose() {
  return svgIcon('icon-close', ['M6 6l12 12', 'M18 6 6 18']);
}
