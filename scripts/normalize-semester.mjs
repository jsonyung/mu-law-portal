const ROMAN = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
};

/**
 * Parse "## Semester: V/I" style labels → { llb3: n, llb5: n } or single programme.
 */
export function parseSemesterLabel(raw) {
  const label = raw.replace(/^Semester:\s*/i, '').trim();
  const parts = label.split('/').map((p) => p.trim().toLowerCase());

  if (parts.length === 2) {
    const first = ROMAN[parts[0]] ?? parseInt(parts[0], 10);
    const second = ROMAN[parts[1]] ?? parseInt(parts[1], 10);
    if (first && second) {
      // Cross-list order varies in the PDF: e.g. V/I = 5yr V / 3yr I; Iii/Vii = 3yr III / 5yr VII.
      if (first > second) {
        return { dual: true, llb5yr: first, llb3yr: second };
      }
      return { dual: true, llb3yr: first, llb5yr: second };
    }
  }

  const single = ROMAN[parts[0]] ?? parseInt(parts[0], 10);
  return { dual: false, single: single || 1 };
}

export function semId(n) {
  return `sem-${n}`;
}
