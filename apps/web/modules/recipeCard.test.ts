import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { toRecipeCards } from './recipeCard';

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

describe('toRecipeCards', () => {
  it('projects only the fields the card lists render', () => {
    expect(toRecipeCards([recipe])).toEqual([
      {
        name: 'Indexed Recipe',
        href: getRecipeUrl(recipe),
        source: 'Test Book · Rum Drinks',
        quantity: undefined,
        searchText: 'indexed recipe appleton signature jamaican rum recipe author',
        chapter: { order: 2, name: 'Rum Drinks' },
        page: 12,
      },
    ]);
  });

  it('carries the picked ingredient quantity to the card', () => {
    const [card] = toRecipeCards(
      [recipe],
      (r) => r.ingredients.find((i) => i.slug === 'appleton-signature')?.quantity,
    );

    expect(card?.quantity).toEqual({ amount: 2, unit: 'oz' });
  });

  it('keeps the average serialized card below 500 bytes', async () => {
    const cards = toRecipeCards(await getAllRecipes());
    const averageSize = Buffer.byteLength(JSON.stringify(cards)) / cards.length;

    expect(averageSize).toBeLessThan(500);
  });
});
