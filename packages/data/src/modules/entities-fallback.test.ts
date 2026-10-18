import slugify from '@sindresorhus/slugify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../types/Recipe.ts';
import { getAuthor } from './authors.ts';
import { getBar } from './bars.ts';
import { getRecipe, getAllRecipes } from './recipes.ts';
import type * as RecipesModule from './recipes.ts';

// The entity loaders fall back to these recipes when no entity file exists,
// so every load here exercises the fallback path (the names below have no
// entity files).
vi.mock('./recipes.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getAllRecipes: vi.fn(),
}));

const baseRecipe = await getRecipe(
  { type: 'book', slug: 'tropical-standard' },
  'daiquiri',
  '02_Preparations - Shaken - Up',
);

function recipeWithAttributions(recipe: Recipe, attributions: Recipe['attributions']) {
  return { ...recipe, attributions };
}

beforeEach(() => {
  vi.mocked(getAllRecipes).mockResolvedValue([
    recipeWithAttributions(baseRecipe, [
      { relation: 'recipe author', source: 'Fallback Fixture Author' },
    ]),
    recipeWithAttributions(baseRecipe, [
      { relation: 'bar', source: 'Fallback Fixture Bar', location: 'Nowhere, XX' },
    ]),
    recipeWithAttributions(baseRecipe, [
      { relation: 'bar', source: 'Fallback Bare Bar' },
    ]),
  ]);
});

describe('entity loaders attribution fallback', () => {
  it('derives an author from attributions when no entity file exists', async () => {
    expect(await getAuthor(slugify('Fallback Fixture Author'))).toEqual({
      name: 'Fallback Fixture Author',
      slug: slugify('Fallback Fixture Author'),
    });
  });

  it('derives a located bar from attributions when no entity file exists', async () => {
    expect(await getBar(slugify('Fallback Fixture Bar Nowhere, XX'))).toEqual({
      name: 'Fallback Fixture Bar',
      slug: slugify('Fallback Fixture Bar Nowhere, XX'),
      location: 'Nowhere, XX',
    });
  });

  it('derives a location-less bar from attributions', async () => {
    expect(await getBar(slugify('Fallback Bare Bar'))).toEqual({
      name: 'Fallback Bare Bar',
      slug: slugify('Fallback Bare Bar'),
    });
  });

  it('still returns undefined when neither file nor attribution matches', async () => {
    expect(await getAuthor('no-such-author')).toBeUndefined();
    expect(await getBar('no-such-bar-location')).toBeUndefined();
  });
});
