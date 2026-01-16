import { describe, expect, it } from 'vitest';
import type { Recipe } from '@/types/Recipe';
import { groupByChapter, isChapterFolder, parseChapterFolder } from './chapters';

describe('parseChapterFolder', () => {
  it('parses valid chapter folder names', () => {
    expect(parseChapterFolder('01_Rum Drinks')).toEqual({ order: 1, name: 'Rum Drinks' });
    expect(parseChapterFolder('02_The History of Tiki')).toEqual({
      order: 2,
      name: 'The History of Tiki',
    });
    expect(parseChapterFolder('10_Appendix')).toEqual({ order: 10, name: 'Appendix' });
  });

  it('returns null for invalid folder names', () => {
    expect(parseChapterFolder('_source.json')).toBeNull();
    expect(parseChapterFolder('regular-recipe.json')).toBeNull();
    expect(parseChapterFolder('no-number')).toBeNull();
    expect(parseChapterFolder('Rum Drinks')).toBeNull();
    expect(parseChapterFolder('01')).toBeNull();
    expect(parseChapterFolder('_01_Name')).toBeNull();
  });
});

describe('isChapterFolder', () => {
  it('returns true for chapter folders', () => {
    expect(isChapterFolder('01_Introduction')).toBe(true);
    expect(isChapterFolder('12_Appendix')).toBe(true);
    expect(isChapterFolder('99_Final Chapter')).toBe(true);
  });

  it('returns false for non-chapter entries', () => {
    expect(isChapterFolder('_source.json')).toBe(false);
    expect(isChapterFolder('recipe.json')).toBe(false);
    expect(isChapterFolder('Introduction')).toBe(false);
    expect(isChapterFolder('01')).toBe(false);
  });
});

describe('groupByChapter', () => {
  const createRecipe = (name: string, chapter?: string): Recipe =>
    ({
      name,
      slug: name.toLowerCase().replace(/\s/g, '-'),
      chapter,
    }) as Recipe;

  it('groups recipes by chapter in order', () => {
    const recipes = [
      createRecipe('Recipe C', '02_Chapter Two'),
      createRecipe('Recipe A', '01_Chapter One'),
      createRecipe('Recipe B', '01_Chapter One'),
    ];

    const groups = groupByChapter(recipes);

    expect(groups).toEqual([
      ['Chapter One', expect.arrayContaining([recipes[1], recipes[2]])],
      ['Chapter Two', [recipes[0]]],
    ]);
  });

  it('sorts recipes alphabetically within each chapter', () => {
    const recipes = [
      createRecipe('Zombie', '01_Rum'),
      createRecipe('Daiquiri', '01_Rum'),
      createRecipe('Mai Tai', '01_Rum'),
    ];

    const groups = groupByChapter(recipes);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.[0]).toBe('Rum');
    expect(groups[0]?.[1].map((r) => r.name)).toEqual(['Daiquiri', 'Mai Tai', 'Zombie']);
  });

  it('puts recipes without chapter in Etc group at end', () => {
    const recipes = [
      createRecipe('Recipe A', '01_Chapter One'),
      createRecipe('Recipe B'),
      createRecipe('Recipe C'),
    ];

    const groups = groupByChapter(recipes);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.[0]).toBe('Chapter One');
    expect(groups[1]?.[0]).toBe('Etc');
    expect(groups[1]?.[1].map((r) => r.name)).toEqual(['Recipe B', 'Recipe C']);
  });

  it('handles recipes with invalid chapter format as Etc', () => {
    const recipes = [
      createRecipe('Recipe A', '01_Valid'),
      createRecipe('Recipe B', 'Invalid Format'),
    ];

    const groups = groupByChapter(recipes);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.[0]).toBe('Valid');
    expect(groups[1]?.[0]).toBe('Etc');
    expect(groups[1]?.[1]).toEqual([recipes[1]]);
  });

  it('returns empty array for empty input', () => {
    expect(groupByChapter([])).toEqual([]);
  });

  it('returns only Etc group when no recipes have chapters', () => {
    const recipes = [createRecipe('Recipe A'), createRecipe('Recipe B')];

    const groups = groupByChapter(recipes);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.[0]).toBe('Etc');
  });
});
