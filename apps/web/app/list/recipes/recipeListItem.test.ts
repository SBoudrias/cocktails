import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { getRecipeListItems } from './recipeListItem';

const recipe: Recipe = {
  name: 'Indexed Recipe',
  slug: 'indexed-recipe',
  chapter: { order: 2, name: 'Rum Drinks' },
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  ingredients: [
    {
      name: 'Appleton Signature',
      slug: 'appleton-signature',
      type: 'spirit',
      categories: [
        {
          name: 'Jamaican Rum',
          slug: 'jamaican-rum',
          type: 'category',
          parents: [],
          refs: [],
        },
      ],
      refs: [],
      ingredients: [],
      quantity: { amount: 2, unit: 'oz' },
    },
  ],
  instructions: ['Shake with ice.'],
  source: {
    type: 'book',
    name: 'Test Book',
    slug: 'test-book',
    link: 'https://example.com',
    description: 'A source description that should not reach the client.',
    recipeAmount: 1,
  },
  attributions: [{ relation: 'recipe author', source: 'Recipe Author' }],
  refs: [{ type: 'book', title: 'Test Book', page: 12 }],
};

describe('getRecipeListItems', () => {
  it('projects only the fields needed by the recipes page', () => {
    expect(getRecipeListItems([recipe])).toEqual([
      {
        name: 'Indexed Recipe',
        href: getRecipeUrl(recipe),
        source: 'Test Book · Rum Drinks',
        searchText: 'indexed recipe appleton signature jamaican rum recipe author',
      },
    ]);
  });

  it('keeps the average serialized record below 500 bytes', async () => {
    const items = getRecipeListItems(await getAllRecipes());
    const averageSize = Buffer.byteLength(JSON.stringify(items)) / items.length;

    expect(averageSize).toBeLessThan(500);
  });
});
