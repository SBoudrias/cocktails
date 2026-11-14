import { describe, it, expect } from 'vitest';
import { createByLocationListConfig, getBarCity } from './by-location';

describe('getBarCity', () => {
  it('extracts the city from a location with a region', () => {
    expect(getBarCity({ location: 'New Orleans, LA' })).toBe('New Orleans');
  });

  it('extracts the city from a location with a country', () => {
    expect(getBarCity({ location: 'Paris, France' })).toBe('Paris');
  });

  it('keys off the last segment: the one before it is the city', () => {
    expect(getBarCity({ location: 'Disneyland, Anaheim, CA' })).toBe('Anaheim');
    expect(getBarCity({ location: 'Waikiki, Honolulu, HI' })).toBe('Honolulu');
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

  it('ignores trailing empty segments', () => {
    expect(getBarCity({ location: 'Brooklyn, NY,' })).toBe('Brooklyn');
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

  const config = createByLocationListConfig();

  it('groups bars by city', () => {
    expect(config.groupBy(bars[0]!)).toBe('Chicago');
    expect(config.groupBy(bars[4]!)).toBe('Unknown');
  });

  it('orders cities alphabetically regardless of bar count', () => {
    const headers = ['Brooklyn', 'Chicago', 'New York', 'Unknown'].toSorted(
      config.sortHeaderBy,
    );
    expect(headers).toEqual(['Brooklyn', 'Chicago', 'New York', 'Unknown']);
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
