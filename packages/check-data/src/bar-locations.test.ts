import { describe, expect, it } from 'vitest';
import { findInconsistentBarLocations } from './bar-locations.ts';

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
