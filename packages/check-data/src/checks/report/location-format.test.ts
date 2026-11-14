import { describe, expect, it } from 'vitest';
import { findInvalidLocationFormats } from './location-format.ts';

describe('findInvalidLocationFormats', () => {
  it('passes locations ending in a USPS state code', () => {
    const result = findInvalidLocationFormats([
      { name: 'Three Dots and a Dash', location: 'Chicago, IL', filepath: 'a.json' },
      { name: 'Strong Water', location: 'Anaheim, CA', filepath: 'b.json' },
    ]);

    expect(result).toEqual([]);
  });

  it('fails full state names and suggests the 2-letter code', () => {
    const result = findInvalidLocationFormats([
      { name: 'Strong Water', location: 'Anaheim, California', filepath: 'a.json' },
    ]);

    expect(result).toEqual([
      {
        name: 'Strong Water',
        location: 'Anaheim, California',
        region: 'California',
        suggestedCode: 'CA',
        exampleFile: 'a.json',
      },
    ]);
  });

  it('fails a bare city with no state and suggests nothing', () => {
    const result = findInvalidLocationFormats([
      { name: 'The Violet Hour', location: 'Chicago', filepath: 'a.json' },
    ]);

    expect(result).toEqual([
      {
        name: 'The Violet Hour',
        location: 'Chicago',
        region: 'Chicago',
        exampleFile: 'a.json',
      },
    ]);
  });

  it('passes locations ending in a Canadian province code or the UK code', () => {
    const result = findInvalidLocationFormats([
      { name: 'The Shameful Tiki Room', location: 'Vancouver, BC', filepath: 'a.json' },
      { name: 'Laki Kane', location: 'London, UK', filepath: 'b.json' },
    ]);

    expect(result).toEqual([]);
  });

  it('passes locations ending in a known country', () => {
    const result = findInvalidLocationFormats([
      { name: 'Bar High Five', location: 'Tokyo, Japan', filepath: 'a.json' },
      { name: 'Sway', location: 'Sweden', filepath: 'b.json' },
      { name: 'Neon Pigeon', location: 'Singapore', filepath: 'c.json' },
      {
        name: 'Caribe Hilton Hotel',
        location: 'San Juan, Puerto Rico',
        filepath: 'd.json',
      },
    ]);

    expect(result).toEqual([]);
  });

  it('passes a venue or neighborhood leading the chain before the state code', () => {
    const result = findInvalidLocationFormats([
      { name: 'Oga’s Cantina', location: 'Disneyland, Anaheim, CA', filepath: 'a.json' },
      { name: 'Halekulani Hotel', location: 'Waikiki, Honolulu, HI', filepath: 'b.json' },
      {
        name: 'Bar Zenith',
        location: 'Universal Epic Universe, Orlando, FL',
        filepath: 'c.json',
      },
    ]);

    expect(result).toEqual([]);
  });

  it('fails an unknown country', () => {
    const result = findInvalidLocationFormats([
      { name: 'Bar', location: 'Lisbon, Portugal', filepath: 'a.json' },
    ]);

    expect(result).toEqual([
      {
        name: 'Bar',
        location: 'Lisbon, Portugal',
        region: 'Portugal',
        exampleFile: 'a.json',
      },
    ]);
  });

  it('reports each distinct location once, keeping an example file', () => {
    const result = findInvalidLocationFormats([
      { name: 'The Violet Hour', location: 'Chicago', filepath: 'a.json' },
      { name: 'The Violet Hour', location: 'Chicago', filepath: 'b.json' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.exampleFile).toBe('a.json');
  });

  it('skips attributions with no location', () => {
    const result = findInvalidLocationFormats([
      { name: 'Clyde Common', filepath: 'a.json' },
    ]);

    expect(result).toEqual([]);
  });
});
