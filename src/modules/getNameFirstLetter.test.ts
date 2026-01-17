import { describe, it, expect } from 'vitest';
import { getNameFirstLetter, getNameForSorting } from './getNameFirstLetter';

describe('getNameFirstLetter', () => {
  it('returns the first letter of a simple name', () => {
    expect(getNameFirstLetter({ name: 'Mojito' })).toBe('M');
  });

  it('returns uppercase letter', () => {
    expect(getNameFirstLetter({ name: 'daiquiri' })).toBe('D');
  });

  it('strips leading "the" article', () => {
    expect(getNameFirstLetter({ name: 'The Last Word' })).toBe('L');
  });

  it('strips leading "a" article', () => {
    expect(getNameFirstLetter({ name: 'A Perfect Storm' })).toBe('P');
  });

  it('strips leading "an" article', () => {
    expect(getNameFirstLetter({ name: 'An Old Fashioned' })).toBe('O');
  });

  it('handles case insensitive article stripping', () => {
    expect(getNameFirstLetter({ name: 'THE STORM' })).toBe('S');
    expect(getNameFirstLetter({ name: 'the storm' })).toBe('S');
  });

  it('returns the first character for names starting with non-letter', () => {
    expect(getNameFirstLetter({ name: '123 Cocktail' })).toBe('1');
  });

  it('handles empty string', () => {
    expect(getNameFirstLetter({ name: '' })).toBe('#');
  });
});

describe('getNameForSorting', () => {
  it('returns the name unchanged when no article', () => {
    expect(getNameForSorting({ name: 'Mojito' })).toBe('Mojito');
  });

  it('strips leading "the" article', () => {
    expect(getNameForSorting({ name: 'The Last Word' })).toBe('Last');
  });

  it('strips leading "a" article', () => {
    expect(getNameForSorting({ name: 'A Perfect Storm' })).toBe('Perfect');
  });

  it('strips leading "an" article', () => {
    expect(getNameForSorting({ name: 'An Old Fashioned' })).toBe('Old');
  });

  it('handles case insensitive article stripping', () => {
    expect(getNameForSorting({ name: 'THE STORM' })).toBe('STORM');
    expect(getNameForSorting({ name: 'the storm' })).toBe('storm');
  });

  it('handles empty string', () => {
    expect(getNameForSorting({ name: '' })).toBe('');
  });
});
