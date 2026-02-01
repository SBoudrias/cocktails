import type { Chapter, Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import {
  compareByPage,
  compareChapterHeaders,
  createByChapterListConfig,
  createChapterHeaderComparator,
  getChapterName,
} from './by-chapter';

function parseChapterFolder(folder: string): Chapter | undefined {
  const match = folder.match(/^(\d+)_(.+)$/);
  if (!match || !match[1] || !match[2]) return undefined;
  return { order: parseInt(match[1], 10), name: match[2] };
}

const createRecipe = (name: string, chapterFolder?: string, page?: number): Recipe =>
  ({
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    chapter: chapterFolder ? parseChapterFolder(chapterFolder) : undefined,
    refs: page ? [{ type: 'book', title: 'Test Book', page }] : [],
  }) as Recipe;

describe('getChapterName', () => {
  it('extracts chapter name from valid chapter folder', () => {
    expect(getChapterName(createRecipe('Test', '01_Rum Drinks'))).toBe('Rum Drinks');
    expect(getChapterName(createRecipe('Test', '02_The History of Tiki'))).toBe(
      'The History of Tiki',
    );
  });

  it('returns Etc for recipes without chapter', () => {
    expect(getChapterName(createRecipe('Test'))).toBe('Etc');
  });

  it('returns Etc for invalid chapter format', () => {
    expect(getChapterName(createRecipe('Test', 'Invalid Format'))).toBe('Etc');
  });
});

describe('compareByPage', () => {
  it('sorts recipes by page number', () => {
    const recipe1 = createRecipe('A', '01_Rum', 10);
    const recipe2 = createRecipe('B', '01_Rum', 5);
    const recipe3 = createRecipe('C', '01_Rum', 15);

    const sorted = [recipe1, recipe2, recipe3].toSorted(compareByPage);

    expect(sorted.map((r) => r.name)).toEqual(['B', 'A', 'C']);
  });

  it('puts recipes without page at end', () => {
    const recipe1 = createRecipe('A', '01_Rum', 10);
    const recipe2 = createRecipe('B', '01_Rum');

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
  it('sorts chapters by their order prefix', () => {
    const recipes = [
      createRecipe('A', '03_Chapter Three'),
      createRecipe('B', '01_Chapter One'),
      createRecipe('C', '02_Chapter Two'),
    ];

    const comparator = createChapterHeaderComparator(recipes);

    const headers = ['Chapter Three', 'Chapter One', 'Chapter Two'].toSorted(comparator);
    expect(headers).toEqual(['Chapter One', 'Chapter Two', 'Chapter Three']);
  });

  it('puts Etc at end', () => {
    const recipes = [createRecipe('A', '01_Rum'), createRecipe('B')];

    const comparator = createChapterHeaderComparator(recipes);

    expect(comparator('Etc', 'Rum')).toBe(1);
    expect(comparator('Rum', 'Etc')).toBe(-1);
  });
});

describe('createByChapterListConfig', () => {
  it('creates a config with proper grouping and sorting', () => {
    const recipes = [
      createRecipe('Zombie', '01_Rum', 50),
      createRecipe('Daiquiri', '01_Rum', 10),
      createRecipe('Mai Tai', '02_Tiki', 30),
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
