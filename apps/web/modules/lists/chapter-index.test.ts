import type { Chapter, Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import { createChapterIndexMap } from './chapter-index';

const createRecipe = (name: string, chapter?: Chapter, page?: number): Recipe =>
  ({
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    chapter,
    refs: page ? [{ type: 'book', title: 'Test Book', page }] : [],
  }) as Recipe;

describe('createChapterIndexMap', () => {
  it('builds ordered chapter number indexes from chapter order', () => {
    const recipes = [
      createRecipe('A', { order: 2, name: 'The Golden Era' }),
      createRecipe('B', { order: 1, name: 'The Birth of Tiki' }),
      createRecipe('C', { order: 9, name: 'Eight Essential Exotic Elixirs' }),
    ];

    const { indexes, headerIndex } = createChapterIndexMap(recipes);

    expect(indexes).toEqual(['01', '02', '09']);
    expect(headerIndex.get('The Birth of Tiki')).toBe('01');
    expect(headerIndex.get('The Golden Era')).toBe('02');
    expect(headerIndex.get('Eight Essential Exotic Elixirs')).toBe('09');
  });

  it('numbers Etc after the last chapter order', () => {
    const recipes = [
      createRecipe('A', { order: 1, name: 'Rum' }),
      createRecipe('B', { order: 3, name: 'Tiki' }),
      createRecipe('C'),
    ];

    const { indexes, headerIndex } = createChapterIndexMap(recipes);

    expect(indexes).toEqual(['01', '03', '04']);
    expect(headerIndex.get('Etc')).toBe('04');
  });

  it('handles a lone Etc group', () => {
    const { indexes, headerIndex } = createChapterIndexMap([createRecipe('A')]);

    expect(indexes).toEqual(['01']);
    expect(headerIndex.get('Etc')).toBe('01');
  });

  it('pads to two digits', () => {
    const { indexes } = createChapterIndexMap([
      createRecipe('A', { order: 5, name: 'Five' }),
      createRecipe('B', { order: 12, name: 'Twelve' }),
    ]);

    expect(indexes).toEqual(['05', '12']);
  });
});
