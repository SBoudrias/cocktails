import { describe, expect, it } from 'vitest';
import { findRedundantCategoryPairs } from './category-similarity.ts';

const cat = (name: string, categoryType = 'liqueur', parents?: string[]) => ({
  name,
  categoryType,
  ...(parents ? { parents } : {}),
});

describe('findRedundantCategoryPairs', () => {
  it('finds a category duplicated with a generic suffix', () => {
    expect(findRedundantCategoryPairs([cat('Ginger'), cat('Ginger liqueur')])).toEqual([
      { a: cat('Ginger'), b: cat('Ginger liqueur') },
    ]);
  });

  it('allows a generic parent category with declared children', () => {
    expect(
      findRedundantCategoryPairs([
        cat('Falernum'),
        cat('Falernum liqueur', 'liqueur', ['Falernum']),
        cat('Falernum syrup', 'syrup', ['Falernum']),
      ]),
    ).toEqual([]);
  });

  it('still flags an undeclared parent/child pair of the same type', () => {
    expect(
      findRedundantCategoryPairs([cat('Falernum'), cat('Falernum liqueur')]),
    ).toEqual([{ a: cat('Falernum'), b: cat('Falernum liqueur') }]);
  });

  it('matches parent names case-insensitively', () => {
    expect(
      findRedundantCategoryPairs([
        cat('Falernum'),
        cat('Falernum liqueur', 'liqueur', ['falernum']),
      ]),
    ).toEqual([]);
  });

  it('is case-insensitive and collapses extra spaces', () => {
    expect(findRedundantCategoryPairs([cat('Ginger'), cat('ginger  Liqueur')])).toEqual([
      { a: cat('Ginger'), b: cat('ginger  Liqueur') },
    ]);
  });

  it('finds the suffix in either direction', () => {
    expect(findRedundantCategoryPairs([cat('Cassis liqueur'), cat('Cassis')])).toEqual([
      { a: cat('Cassis liqueur'), b: cat('Cassis') },
    ]);
  });

  it('ignores pairs of different category types', () => {
    expect(
      findRedundantCategoryPairs([
        cat('Falernum', 'liqueur'),
        cat('Falernum syrup', 'syrup'),
      ]),
    ).toEqual([]);
  });

  it('ignores distinct subcategories sharing a parent word', () => {
    expect(
      findRedundantCategoryPairs([
        cat('Orange liqueur'),
        cat('Orange Curaçao'),
        cat('Triple Sec'),
      ]),
    ).toEqual([]);
  });

  it('does not flag identical names', () => {
    expect(
      findRedundantCategoryPairs([cat('Porter', 'beer'), cat('Porter', 'beer')]),
    ).toEqual([]);
  });

  it('does not flag clearly different names', () => {
    expect(
      findRedundantCategoryPairs([cat('Crème de Mûre'), cat('Blackberry liqueur')]),
    ).toEqual([]);
  });
});
