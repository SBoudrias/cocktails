import { describe, expect, it } from 'vitest';
import { findInconsistentBarLocations, findSimilarBarNames } from './bar-locations.ts';

describe('findInconsistentBarLocations', () => {
  it('flags a name used with two different locations', () => {
    const result = findInconsistentBarLocations([
      { name: 'Three Dots and a Dash', location: 'Chicago, IL', filepath: 'a.json' },
      { name: 'Three Dots and a Dash', location: 'Chicago', filepath: 'b.json' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Three Dots and a Dash');
    expect(result[0]?.variants).toHaveLength(2);
  });

  it('flags a name used with and without a location', () => {
    const result = findInconsistentBarLocations([
      { name: 'Trader Sam\u2019s', location: 'Anaheim, CA', filepath: 'a.json' },
      { name: 'Trader Sam’s', filepath: 'b.json' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.variants.map((variant) => variant.location)).toEqual(
      expect.arrayContaining(['Anaheim, CA', null]),
    );
  });

  it('groups names case-insensitively', () => {
    const result = findInconsistentBarLocations([
      { name: 'the zam zam', location: 'San Francisco, CA', filepath: 'a.json' },
      { name: 'The Zam Zam', location: 'san francisco, ca', filepath: 'b.json' },
    ]);

    expect(result).toHaveLength(0);
  });

  it('passes consistent bars, including multiple locations', () => {
    const result = findInconsistentBarLocations([
      { name: 'Death & Co', location: 'New York, NY', filepath: 'a.json' },
      { name: 'Death & Co', location: 'New York, NY', filepath: 'b.json' },
    ]);

    expect(result).toHaveLength(0);
  });

  it('counts usages and keeps an example file per variant', () => {
    const result = findInconsistentBarLocations([
      { name: 'Mai-Kai', location: 'Fort Lauderdale, FL', filepath: 'a.json' },
      { name: 'Mai-Kai', location: 'Fort Lauderdale, FL', filepath: 'b.json' },
      { name: 'Mai-Kai', location: 'Oakland, CA', filepath: 'c.json' },
    ]);

    expect(result).toHaveLength(1);
    const variants = result[0]?.variants.toSorted((a, b) =>
      (a.location ?? '').localeCompare(b.location ?? ''),
    );
    expect(variants?.[0]).toMatchObject({ location: 'Fort Lauderdale, FL', count: 2 });
    expect(variants?.[1]).toMatchObject({
      location: 'Oakland, CA',
      count: 1,
      exampleFile: 'c.json',
    });
  });

  it('returns nothing for an empty list', () => {
    expect(findInconsistentBarLocations([])).toEqual([]);
  });
});

describe('findSimilarBarNames', () => {
  it('flags a name contained inside another with one or two extra words', () => {
    const result = findSimilarBarNames([
      { name: "Disney's Polynesian Resort", filepath: 'a.json' },
      { name: "Disney's Polynesian Village Resort", filepath: 'b.json' },
    ]);

    expect(result).toEqual([
      {
        shortName: "Disney's Polynesian Resort",
        longName: "Disney's Polynesian Village Resort",
        extras: ['village'],
      },
    ]);
  });

  it('flags short-form credits of the same venue', () => {
    const result = findSimilarBarNames([
      { name: 'Caribe Hilton', location: 'San Juan, Puerto Rico', filepath: 'a.json' },
      {
        name: 'Caribe Hilton Hotel',
        location: 'San Juan, Puerto Rico',
        filepath: 'b.json',
      },
    ]);

    expect(result).toEqual([
      {
        shortName: 'Caribe Hilton',
        longName: 'Caribe Hilton Hotel',
        extras: ['hotel'],
      },
    ]);
  });

  it('ignores generic words like articles when comparing', () => {
    const result = findSimilarBarNames([
      { name: 'The Zam Zam', location: 'San Francisco, CA', filepath: 'a.json' },
      { name: 'Zam Zam', location: 'San Francisco, CA', filepath: 'b.json' },
    ]);

    expect(result).toEqual([]);
  });

  it('does not flag names sharing only a generic word', () => {
    const result = findSimilarBarNames([
      { name: 'Accomplice Bar', location: 'Mar Vista, CA', filepath: 'a.json' },
      { name: 'Aviary Bar', location: 'Kuala Lumpur, Malaysia', filepath: 'b.json' },
    ]);

    expect(result).toEqual([]);
  });

  it('does not flag names with three or more extra words', () => {
    const result = findSimilarBarNames([
      { name: 'Mai-Kai', location: 'Fort Lauderdale, FL', filepath: 'a.json' },
      {
        name: 'Hawaiian Village Motel and Restaurant',
        location: 'Tampa, FL',
        filepath: 'b.json',
      },
    ]);

    expect(result).toEqual([]);
  });
});
