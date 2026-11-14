import { describe, it, expect } from 'vitest';
import { byLocationListConfig, getBarLocationLabel } from './by-location';

describe('getBarLocationLabel', () => {
  it('returns the full location, state included', () => {
    expect(getBarLocationLabel({ location: 'New Orleans, LA' })).toBe('New Orleans, LA');
  });

  it('returns the full location, country included', () => {
    expect(getBarLocationLabel({ location: 'Paris, France' })).toBe('Paris, France');
  });

  it('returns multi-segment locations unchanged', () => {
    expect(getBarLocationLabel({ location: 'Disneyland, Anaheim, CA' })).toBe(
      'Disneyland, Anaheim, CA',
    );
  });

  it('returns comma-less locations as their own label', () => {
    expect(getBarLocationLabel({ location: 'Singapore' })).toBe('Singapore');
  });

  it('returns Unknown when there is no location', () => {
    expect(getBarLocationLabel({})).toBe('Unknown');
  });

  it('returns Unknown for empty and whitespace locations', () => {
    expect(getBarLocationLabel({ location: '' })).toBe('Unknown');
    expect(getBarLocationLabel({ location: '  ' })).toBe('Unknown');
  });

  it('trims surrounding whitespace', () => {
    expect(getBarLocationLabel({ location: '  Brooklyn, NY  ' })).toBe('Brooklyn, NY');
  });
});

describe('byLocationListConfig', () => {
  const bars = [
    { name: 'Bar Three', location: 'Chicago, IL' },
    { name: 'Bar Four', location: 'New York, NY' },
    { name: 'Bar One', location: 'New York, NY' },
    { name: 'Bar Two', location: 'Brooklyn, NY' },
    { name: 'Mystery Bar' },
  ];

  it('groups bars by their location label', () => {
    expect(byLocationListConfig.groupBy(bars[0]!)).toBe('Chicago, IL');
    expect(byLocationListConfig.groupBy(bars[4]!)).toBe('Unknown');
  });

  it('orders locations alphabetically regardless of bar count', () => {
    const headers = ['Brooklyn, NY', 'Chicago, IL', 'New York, NY', 'Unknown'].toSorted(
      byLocationListConfig.sortHeaderBy,
    );
    expect(headers).toEqual(['Brooklyn, NY', 'Chicago, IL', 'New York, NY', 'Unknown']);
  });

  it('always puts Unknown last', () => {
    expect(byLocationListConfig.sortHeaderBy('Unknown', 'New York, NY')).toBeGreaterThan(
      0,
    );
    expect(byLocationListConfig.sortHeaderBy('New York, NY', 'Unknown')).toBeLessThan(0);
  });

  it('sorts bars within a location alphabetically', () => {
    const city = [bars[1]!, bars[2]!].toSorted(byLocationListConfig.sortItemBy);
    expect(city.map((bar) => bar.name)).toEqual(['Bar Four', 'Bar One']);
  });
});
