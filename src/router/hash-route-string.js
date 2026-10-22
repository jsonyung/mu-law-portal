const ROUTE_RE =
  /^\/(?<programme>llb-3yr|llb-5yr)(?:\/(?<semester>sem-\d+))?(?:\/(?<subject>[^/]+))?(?:\/(?<module>module-\d+))?(?:\/(?<topic>[^/]+))?$/;

/** Pure hash parsing (no store). Supports `#/path#anchor` for in-page targets. */
export function parseHashRoute(hash = '') {
  let raw = String(hash).replace(/^#\/?/, '').trim();
  let routeAnchor = null;
  const anchorSep = raw.indexOf('#');
  if (anchorSep >= 0) {
    routeAnchor = raw.slice(anchorSep + 1) || null;
    raw = raw.slice(0, anchorSep);
  }
  if (!raw) {
    return { empty: true, routeAnchor };
  }
  const m = `/${raw}`.match(ROUTE_RE);
  if (!m?.groups) {
    return { invalid: true, routeAnchor };
  }
  return { ...m.groups, routeAnchor };
}
