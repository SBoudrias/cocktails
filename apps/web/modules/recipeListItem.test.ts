import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { toRecipeListItems } from './recipeListItem';

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

describe('toRecipeListItems', () => {
  it('projects only the fields the recipe lists render', () => {
    const bareItems = toRecipeListItems([recipe]);

    expect(bareItems).toEqual([
      {
        name: 'Indexed Recipe',
        href: getRecipeUrl(recipe),
        source: 'Test Book · Rum Drinks',
        chapter: { order: 2, name: 'Rum Drinks' },
        page: 12,
      },
    ]);
    // Bare items have no quantity key at all, not just an undefined one.
    expect(Object.hasOwn(bareItems[0]!, 'quantity')).toBe(false);
  });

  it('carries the picked ingredient quantity to the item', () => {
    const quantityItems = toRecipeListItems(
      [recipe],
      (r) => r.ingredients.find((i) => i.slug === 'appleton-signature')?.quantity,
    );

    expect(quantityItems[0]?.quantity).toEqual({ amount: 2, unit: 'oz' });
  });

  it('keeps the average serialized item below 500 bytes', async () => {
    const items = toRecipeListItems(await getAllRecipes());
    const averageSize = Buffer.byteLength(JSON.stringify(items)) / items.length;

    expect(averageSize).toBeLessThan(500);
  });
});
