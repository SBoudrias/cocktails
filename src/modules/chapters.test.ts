import { describe, expect, it } from 'vitest';
import { isChapterFolder, parseChapterFolder } from './chapters';

describe('parseChapterFolder', () => {
  it('parses valid chapter folder names', () => {
    expect(parseChapterFolder('01_Rum Drinks')).toEqual({ order: 1, name: 'Rum Drinks' });
    expect(parseChapterFolder('02_The History of Tiki')).toEqual({
      order: 2,
      name: 'The History of Tiki',
    });
    expect(parseChapterFolder('10_Appendix')).toEqual({ order: 10, name: 'Appendix' });
  });

  it('returns null for invalid folder names', () => {
    expect(parseChapterFolder('_source.json')).toBeNull();
    expect(parseChapterFolder('regular-recipe.json')).toBeNull();
    expect(parseChapterFolder('no-number')).toBeNull();
    expect(parseChapterFolder('Rum Drinks')).toBeNull();
    expect(parseChapterFolder('01')).toBeNull();
    expect(parseChapterFolder('_01_Name')).toBeNull();
  });
});

describe('isChapterFolder', () => {
  it('returns true for chapter folders', () => {
    expect(isChapterFolder('01_Introduction')).toBe(true);
    expect(isChapterFolder('12_Appendix')).toBe(true);
    expect(isChapterFolder('99_Final Chapter')).toBe(true);
  });

  it('returns false for non-chapter entries', () => {
    expect(isChapterFolder('_source.json')).toBe(false);
    expect(isChapterFolder('recipe.json')).toBe(false);
    expect(isChapterFolder('Introduction')).toBe(false);
    expect(isChapterFolder('01')).toBe(false);
  });
});
