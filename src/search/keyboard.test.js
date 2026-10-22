import { describe, it, expect } from 'vitest';

/** Mirrors command-palette key handler policy for Cmd/Ctrl+K only. */
function handlePaletteShortcut(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    return 'open-search';
  }
  return null;
}

describe('keyboard policy', () => {
  it('opens search on Cmd/Ctrl+K only, not Cmd/Ctrl+F', () => {
    let prevented = false;
    expect(
      handlePaletteShortcut({
        metaKey: true,
        ctrlKey: false,
        key: 'k',
        preventDefault: () => {
          prevented = true;
        },
      }),
    ).toBe('open-search');
    expect(prevented).toBe(true);

    prevented = false;
    expect(
      handlePaletteShortcut({
        metaKey: true,
        ctrlKey: false,
        key: 'f',
        preventDefault: () => {
          prevented = true;
        },
      }),
    ).toBeNull();
    expect(prevented).toBe(false);
  });
});
