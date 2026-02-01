import type { Chapter, Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import {
  compareByPage,
  compareChapterHeaders,
  createByChapterListConfig,
  createChapterHeaderComparator,
  getChapterName,
} from './by-chapter';

const createRecipe = (name: string, chapter?: Chapter, page?: number): Recipe =>
  ({
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    chapter,
    refs: page ? [{ type: 'book', title: 'Test Book', page }] : [],
  }) as Recipe;

describe('getChapterName', () => {
  it('returns chapter name when present', () => {
    expect(getChapterName(createRecipe('Test', { order: 1, name: 'Rum Drinks' }))).toBe(
      'Rum Drinks',
    );
    expect(
      getChapterName(createRecipe('Test', { order: 2, name: 'The History of Tiki' })),
    ).toBe('The History of Tiki');
  });

  it('returns Etc for recipes without chapter', () => {
    expect(getChapterName(createRecipe('Test'))).toBe('Etc');
  });
});

describe('compareByPage', () => {
  it('sorts recipes by page number', () => {
    const recipe1 = createRecipe('A', { order: 1, name: 'Rum' }, 10);
    const recipe2 = createRecipe('B', { order: 1, name: 'Rum' }, 5);
    const recipe3 = createRecipe('C', { order: 1, name: 'Rum' }, 15);

    const sorted = [recipe1, recipe2, recipe3].toSorted(compareByPage);

    expect(sorted.map((r) => r.name)).toEqual(['B', 'A', 'C']);
  });

  it('puts recipes without page at end', () => {
    const recipe1 = createRecipe('A', { order: 1, name: 'Rum' }, 10);
    const recipe2 = createRecipe('B', { order: 1, name: 'Rum' });

    const sorted = [recipe2, recipe1].toSorted(compareByPage);

    expect(sorted.map((r) => r.name)).toEqual(['A', 'B']);
  });
});

describe('compareChapterHeaders', () => {
  it('sorts Etc to end', () => {
    expect(compareChapterHeaders('Etc', 'Rum')).toBe(1);
    expect(compareChapterHeaders('Rum', 'Etc')).toBe(-1);
  });

  it('sorts other headers alphabetically', () => {
    expect(compareChapterHeaders('Rum', 'Tiki')).toBeLessThan(0);
    expect(compareChapterHeaders('Tiki', 'Rum')).toBeGreaterThan(0);
  });
});

describe('createChapterHeaderComparator', () => {
  it('sorts chapters by their order', () => {
    const recipes = [
      createRecipe('A', { order: 3, name: 'Chapter Three' }),
      createRecipe('B', { order: 1, name: 'Chapter One' }),
      createRecipe('C', { order: 2, name: 'Chapter Two' }),
    ];

    const comparator = createChapterHeaderComparator(recipes);

    const headers = ['Chapter Three', 'Chapter One', 'Chapter Two'].toSorted(comparator);
    expect(headers).toEqual(['Chapter One', 'Chapter Two', 'Chapter Three']);
  });

  it('puts Etc at end', () => {
    const recipes = [createRecipe('A', { order: 1, name: 'Rum' }), createRecipe('B')];

    const comparator = createChapterHeaderComparator(recipes);

    expect(comparator('Etc', 'Rum')).toBe(1);
    expect(comparator('Rum', 'Etc')).toBe(-1);
  });
});

describe('createByChapterListConfig', () => {
  it('creates a config with proper grouping and sorting', () => {
    const recipes = [
      createRecipe('Zombie', { order: 1, name: 'Rum' }, 50),
      createRecipe('Daiquiri', { order: 1, name: 'Rum' }, 10),
      createRecipe('Mai Tai', { order: 2, name: 'Tiki' }, 30),
    ];

    const config = createByChapterListConfig(recipes);

    // Test groupBy
    expect(config.groupBy(recipes[0]!)).toBe('Rum');
    expect(config.groupBy(recipes[2]!)).toBe('Tiki');

    // Test sortItemBy (by page)
    expect(
      [recipes[0]!, recipes[1]!].toSorted(config.sortItemBy).map((r) => r.name),
    ).toEqual(['Daiquiri', 'Zombie']);

    // Test sortHeaderBy (by chapter order)
    expect(config.sortHeaderBy('Tiki', 'Rum')).toBeGreaterThan(0);
    expect(config.sortHeaderBy('Rum', 'Tiki')).toBeLessThan(0);
  });
});
