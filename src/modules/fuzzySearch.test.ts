import { describe, expect, it } from 'vitest';
import { fuzzySearch } from './fuzzySearch';

describe('fuzzySearch', () => {
  const items = [
    { id: 1, name: 'Mojito' },
    { id: 2, name: 'Margarita' },
    { id: 3, name: 'Mai Tai' },
    { id: 4, name: 'Café Royal' },
    { id: 5, name: 'Piña Colada' },
  ];

  const haystack = items.map((item) => item.name.toLowerCase());

  it('returns exact matches', () => {
    const results = fuzzySearch(items, haystack, 'mojito');
    expect(results).toEqual([{ id: 1, name: 'Mojito' }]);
  });

  it('returns fuzzy matches with partial input', () => {
    const results = fuzzySearch(items, haystack, 'marg');
    expect(results).toEqual([{ id: 2, name: 'Margarita' }]);
  });

  it('matches transliterated characters (café matches cafe)', () => {
    const transHaystack = ['cafe royal', 'pina colada', 'mojito'];
    const transItems = [
      { id: 4, name: 'Café Royal' },
      { id: 5, name: 'Piña Colada' },
      { id: 1, name: 'Mojito' },
    ];

    const results = fuzzySearch(transItems, transHaystack, 'café');
    expect(results).toEqual([{ id: 4, name: 'Café Royal' }]);
  });

  it('returns empty array when no match found', () => {
    const results = fuzzySearch(items, haystack, 'whiskey');
    expect(results).toEqual([]);
  });

  it('respects limit parameter', () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const manyHaystack = manyItems.map((item) => item.name.toLowerCase());
    const results = fuzzySearch(manyItems, manyHaystack, 'item', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('returns empty array for empty needle', () => {
    expect(fuzzySearch(items, haystack, '')).toEqual([]);
    expect(fuzzySearch(items, haystack, '   ')).toEqual([]);
  });
});
