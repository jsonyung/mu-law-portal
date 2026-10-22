import { describe, it, expect } from 'vitest';
import {
  isModuleBannerTitleLine,
  normalizeModuleBannerTitle,
} from './state-machine-parser.mjs';

describe('module banner titles', () => {
  it('detects syllabus banner line after bare Module 2 header', () => {
    expect(isModuleBannerTitleLine('INDUSTRIAL RELATIONS: THE INDUSTRIAL DISPUTES')).toBe(true);
    expect(isModuleBannerTitleLine('1. Industry – Conceptual Analysis')).toBe(false);
  });

  it('strips repeated INDUSTRIAL RELATIONS prefix for display', () => {
    expect(normalizeModuleBannerTitle('INDUSTRIAL RELATIONS: THE INDUSTRIAL DISPUTES')).toBe(
      'THE INDUSTRIAL DISPUTES',
    );
  });

  it('detects mixed-case tort module titles from the syllabus PDF', () => {
    expect(isModuleBannerTitleLine('General Principles of Tort')).toBe(true);
    expect(isModuleBannerTitleLine('1.1 Tort: Definition')).toBe(false);
  });

  it('detects contract module scope lines as titles', () => {
    expect(isModuleBannerTitleLine('Sections 1 – 9, 30 – 37 and 68 – 72 of the Indian Contract Act 1872')).toBe(
      true,
    );
  });
});
