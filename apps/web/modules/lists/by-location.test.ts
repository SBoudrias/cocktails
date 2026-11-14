import { describe, it, expect } from 'vitest';
import { createByLocationListConfig, getBarCity } from './by-location';

describe('getBarCity', () => {
  it('extracts the city from a location with a region', () => {
    expect(getBarCity({ location: 'New Orleans, LA' })).toBe('New Orleans');
  });

  it('extracts the city from a location with a country', () => {
    expect(getBarCity({ location: 'Paris, France' })).toBe('Paris');
  });

  it('returns the whole location when there is no comma', () => {
    expect(getBarCity({ location: 'Singapore' })).toBe('Singapore');
  });

  it('returns Unknown when there is no location', () => {
    expect(getBarCity({})).toBe('Unknown');
  });

  it('returns Unknown for empty and whitespace locations', () => {
    expect(getBarCity({ location: '' })).toBe('Unknown');
    expect(getBarCity({ location: '  ' })).toBe('Unknown');
  });
});

describe('createByLocationListConfig', () => {
  const bars = [
    { name: 'Bar Three', location: 'Chicago, IL' },
    { name: 'Bar Four', location: 'New York, NY' },
    { name: 'Bar One', location: 'New York, NY' },
    { name: 'Bar Two', location: 'Brooklyn, NY' },
    { name: 'Mystery Bar' },
  ];

  const config = createByLocationListConfig(bars);

  it('groups bars by city', () => {
    expect(config.groupBy(bars[0]!)).toBe('Chicago');
    expect(config.groupBy(bars[4]!)).toBe('Unknown');
  });

  it('orders cities by bar count descending, ties alphabetically', () => {
    const headers = ['Brooklyn', 'Chicago', 'New York', 'Unknown'].toSorted(
      config.sortHeaderBy,
    );
    expect(headers).toEqual(['New York', 'Brooklyn', 'Chicago', 'Unknown']);
  });

  it('always puts Unknown last', () => {
    expect(config.sortHeaderBy('Unknown', 'New York')).toBeGreaterThan(0);
    expect(config.sortHeaderBy('New York', 'Unknown')).toBeLessThan(0);
  });

  it('sorts bars within a city alphabetically', () => {
    const city = [bars[1]!, bars[2]!].toSorted(config.sortItemBy);
    expect(city.map((bar) => bar.name)).toEqual(['Bar Four', 'Bar One']);
  });
});
