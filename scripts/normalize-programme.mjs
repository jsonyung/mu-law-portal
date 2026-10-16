/**
 * Classify programme header scope from inconsistent PDF headings.
 */
export function classifyProgrammeHeading(line) {
  const t = line.replace(/^#\s*Program:\s*/i, '').trim().toLowerCase();

  if (/3\s*yr.*5\s*yr|5\s*yr.*3\s*yr|3yr\/5|5yr\/3/.test(t)) {
    return 'shared';
  }
  if (/5\s*year|5yr|five\s*year|integrated/.test(t) && !/3\s*yr/.test(t)) {
    return 'five_only';
  }
  if (/3\s*yr|three\s*year/.test(t) && !/5\s*yr/.test(t)) {
    return 'three_only';
  }
  return 'shared';
}
