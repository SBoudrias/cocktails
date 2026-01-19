import { describe, it, expect } from 'vitest';
import type { Recipe } from '@/types/Recipe';
import { getRecipeAttribution } from './getRecipeAttribution';

let recipeCounter = 0;

const mockRecipe = (
  name: string,
  attributions: Recipe['attributions'] = [],
  sourceType: Recipe['source']['type'] = 'book',
): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: {
    type: sourceType,
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions,
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
});

describe('getRecipeAttribution', () => {
  it('prioritizes "adapted by" over "recipe author" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'recipe author', source: 'Original Author' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter | Test Source');
  });

  it('prioritizes "adapted by" over "bar" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'adapted by', source: 'Adapter' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter | Test Source');
  });

  it('prioritizes "recipe author" over "bar" for book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [
        { relation: 'bar', source: 'Some Bar' },
        { relation: 'recipe author', source: 'Author' },
      ],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Author | Test Source');
  });

  it('uses source name for bar attribution with book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'book',
    );

    expect(getRecipeAttribution(recipe)).toBe('Test Source');
  });

  it('uses source name when no attributions exist', () => {
    const recipe = mockRecipe('Test Recipe', [], 'book');

    expect(getRecipeAttribution(recipe)).toBe('Test Source');
  });

  it('handles non-book sources with adapted by attribution', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'adapted by', source: 'Adapter' }],
      'podcast',
    );

    expect(getRecipeAttribution(recipe)).toBe('Adapter');
  });

  it('handles bar attribution with non-book sources', () => {
    const recipe = mockRecipe(
      'Test Recipe',
      [{ relation: 'bar', source: 'Some Bar' }],
      'podcast',
    );

    expect(getRecipeAttribution(recipe)).toBe('served at Some Bar');
  });

  describe('exclude options', () => {
    it('excludes author and shows only book name', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [{ relation: 'recipe author', source: 'John Doe' }],
        'book',
      );

      expect(getRecipeAttribution(recipe, { author: 'John Doe' })).toBe('Test Source');
    });

    it('excludes author case-insensitively', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [{ relation: 'recipe author', source: 'John Doe' }],
        'book',
      );

      expect(getRecipeAttribution(recipe, { author: 'john doe' })).toBe('Test Source');
    });

    it('falls back to next attribution when author excluded and no book', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [
          { relation: 'recipe author', source: 'John Doe' },
          { relation: 'bar', source: 'Test Bar' },
        ],
        'podcast',
      );

      expect(getRecipeAttribution(recipe, { author: 'John Doe' })).toBe(
        'served at Test Bar',
      );
    });

    it('excludes bar and shows book name instead', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [{ relation: 'bar', source: 'Death & Co' }],
        'book',
      );

      expect(getRecipeAttribution(recipe, { bar: 'Death & Co' })).toBe('Test Source');
    });

    it('returns undefined when bar excluded and no book', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [{ relation: 'bar', source: 'Death & Co' }],
        'podcast',
      );

      expect(getRecipeAttribution(recipe, { bar: 'Death & Co' })).toBe('Test Source');
    });

    it('excludes source name from fallback', () => {
      const recipe = mockRecipe('Test Recipe', [], 'book');

      expect(getRecipeAttribution(recipe, { source: 'Test Source' })).toBeUndefined();
    });

    it('returns undefined when all attributions are excluded', () => {
      const recipe = mockRecipe(
        'Test Recipe',
        [{ relation: 'recipe author', source: 'John Doe' }],
        'podcast',
      );

      expect(
        getRecipeAttribution(recipe, { author: 'John Doe', source: 'Test Source' }),
      ).toBeUndefined();
    });
  });
});
