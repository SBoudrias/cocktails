import { describe, it, expect } from 'vitest';
import { getNameFirstLetter } from './getNameFirstLetter';

describe('getNameFirstLetter', () => {
  it('returns the first letter of a simple name', () => {
    expect(getNameFirstLetter('Mojito')).toBe('M');
  });

  it('returns uppercase letter', () => {
    expect(getNameFirstLetter('daiquiri')).toBe('D');
  });

  it('strips leading "the" article', () => {
    expect(getNameFirstLetter('The Last Word')).toBe('L');
  });

  it('strips leading "a" article', () => {
    expect(getNameFirstLetter('A Perfect Storm')).toBe('P');
  });

  it('strips leading "an" article', () => {
    expect(getNameFirstLetter('An Old Fashioned')).toBe('O');
  });

  it('handles case insensitive article stripping', () => {
    expect(getNameFirstLetter('THE STORM')).toBe('S');
    expect(getNameFirstLetter('the storm')).toBe('S');
  });

  it('returns the first character for names starting with non-letter', () => {
    expect(getNameFirstLetter('123 Cocktail')).toBe('1');
  });

  it('handles empty string', () => {
    expect(getNameFirstLetter('')).toBe('#');
  });
});
