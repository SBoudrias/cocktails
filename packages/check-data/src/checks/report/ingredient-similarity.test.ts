import { describe, expect, it } from 'vitest';
import { findSimilarIngredientPairs } from './ingredient-similarity.ts';

describe('findSimilarIngredientPairs', () => {
  it('finds pairs that differ by a single letter', () => {
    expect(findSimilarIngredientPairs(['Solo 1971 Mezcal', 'Yola 1971 Mezcal'])).toEqual([
      { a: 'Solo 1971 Mezcal', b: 'Yola 1971 Mezcal' },
    ]);
  });

  it('finds singular/plural pairs', () => {
    expect(findSimilarIngredientPairs(['Grape', 'Grapes'])).toEqual([
      { a: 'Grape', b: 'Grapes' },
    ]);
  });

  it('ignores age statements that only differ by digits', () => {
    expect(findSimilarIngredientPairs(['El Dorado 15 Year', 'El Dorado 5 Year'])).toEqual(
      [],
    );
    expect(findSimilarIngredientPairs(['Zacapa 23', 'Zacapa XO'])).toEqual([]);
  });

  it('finds pairs where digits are stripped and names differ by a letter', () => {
    expect(
      findSimilarIngredientPairs(['Wild Turkey 101 Rye', 'Wild Turkey Rye']),
    ).toEqual([{ a: 'Wild Turkey Rye', b: 'Wild Turkey 101 Rye' }]);
    expect(
      findSimilarIngredientPairs(['Pierre Ferrand 1840 Cognac', 'Pierre Ferrand Cognac']),
    ).toEqual([{ a: 'Pierre Ferrand Cognac', b: 'Pierre Ferrand 1840 Cognac' }]);
  });

  it('finds pairs across different name lengths', () => {
    const pairs = findSimilarIngredientPairs([
      'Coconut milk',
      'coconut oil',
      'coconut mix',
    ]);
    const normalized = pairs.map(({ a, b }) => [a, b].toSorted()).toSorted();
    expect(normalized).toEqual([
      ['Coconut milk', 'coconut mix'],
      ['Coconut milk', 'coconut oil'],
      ['coconut mix', 'coconut oil'],
    ]);
  });

  it('does not flag identical names', () => {
    expect(findSimilarIngredientPairs(['Coconut milk', 'Coconut milk'])).toEqual([]);
  });

  it('does not flag clearly different names', () => {
    expect(findSimilarIngredientPairs(['Hemingway', 'Smugglers Cove'])).toEqual([]);
  });

  it('does not flag very short names (below min length guard)', () => {
    expect(findSimilarIngredientPairs(['Bob', 'Rob'])).toEqual([]);
  });

  it('handles a large list efficiently', () => {
    const names = Array.from({ length: 1000 }, (_, i) => `Ingredient ${i}`);
    const pairs = findSimilarIngredientPairs(names);
    expect(pairs).toEqual([]);
  });
});
