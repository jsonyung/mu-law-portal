/**
 * Build programme-correct hash paths from indexed record metadata (not title text).
 */

export function pickProgrammeRoute(record, preferredProgrammeId, filterProgrammeId) {
  const routes = record.routes || [];
  if (!routes.length) return null;

  const targetProg = filterProgrammeId || preferredProgrammeId || 'llb-3yr';
  return routes.find((r) => r.programmeId === targetProg) || routes[0];
}

export function buildHashFromRecord(record, route) {
  if (!route) return null;

  const { programmeId, semesterId, subjectSlug } = route;
  if (!programmeId || !semesterId || !subjectSlug) return null;

  let hash = `#/${programmeId}/${semesterId}/${subjectSlug}`;

  const type = record.recordType;
  if (type === 'module' && record.moduleId) {
    hash += `/${record.moduleId}`;
  } else if ((type === 'topic' || type === 'case' || type === 'statute') && record.moduleId && record.topicId) {
    hash += `/${record.moduleId}/${record.topicId}`;
  }

  return hash;
}

export function readingAnchorId(record) {
  if (record.recordType !== 'reading') return null;
  if (record.anchorId) return record.anchorId;
  const parts = record.id.split(':');
  if (parts.length >= 3) {
    return `reading-${parts[1]}-${parts[2]}`;
  }
  return `reading-${record.id.replace(/:/g, '-')}`;
}

/**
 * @returns {null | { hash, programmeId, semesterId, subjectSlug, moduleId, topicId, readingAnchorId, recordType, recordId }}
 */
export function buildNavigationTarget(record, preferredProgrammeId, filterProgrammeId) {
  if (!record?.id) return null;

  const route = pickProgrammeRoute(record, preferredProgrammeId, filterProgrammeId);
  const hash = buildHashFromRecord(record, route);
  if (!hash) return null;

  return {
    hash,
    programmeId: route.programmeId,
    semesterId: route.semesterId,
    subjectSlug: record.subjectSlug || route.subjectSlug,
    moduleId: record.moduleId || route.moduleId || null,
    topicId: record.topicId || route.topicId || null,
    readingAnchorId: readingAnchorId(record),
    recordType: record.recordType,
    recordId: record.id,
  };
}
