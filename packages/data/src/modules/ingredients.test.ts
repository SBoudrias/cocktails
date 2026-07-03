import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Source } from '../types/Source.ts';
import { getAllRecipes } from './recipes';

vi.mock('./recipes', () => ({ getAllRecipes: vi.fn() }));

const source = {
  type: 'book',
  name: 'Test Book',
  slug: 'test-book',
  link: 'https://example.com',
  description: 'Test recipes',
  recipeAmount: 3,
} satisfies Source;

const wholeMilk = {
  name: 'Whole milk',
  slug: 'whole-milk',
  type: 'other',
  categories: [],
  refs: [],
  ingredients: [],
} satisfies RootIngredient;

const recipes: Recipe[] = [
  {
    name: 'Ordinary Milk Drink',
    slug: 'ordinary-milk-drink',
    preparation: 'shaken',
    served_on: 'up',
    glassware: 'coupe',
    ingredients: [{ ...wholeMilk, quantity: { amount: 1, unit: 'oz' } }],
    source,
    attributions: [],
    refs: [],
  },
  {
    name: 'Clarified Drink',
    slug: 'clarified-drink',
    preparation: 'stirred',
    techniques: [
      {
        technique: 'clarification',
        method: 'milk',
        milk_type: 'Whole milk',
        quantity: { amount: 4, unit: 'oz' },
      },
    ],
    served_on: 'up',
    glassware: 'coupe',
    ingredients: [],
    source,
    attributions: [],
    refs: [],
  },
  {
    name: 'Coconut Clarified Drink',
    slug: 'coconut-clarified-drink',
    preparation: 'stirred',
    techniques: [
      {
        technique: 'clarification',
        method: 'milk',
        milk_type: 'Coconut milk',
        quantity: { amount: 4, unit: 'oz' },
      },
    ],
    served_on: 'up',
    glassware: 'coupe',
    ingredients: [],
    source,
    attributions: [],
    refs: [],
  },
];

describe('getRecipesForIngredient', () => {
  beforeEach(() => {
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);
  });

  it('includes recipes that use an ingredient as a clarification material', async () => {
    const { getRecipesForIngredient } = await import('./ingredients');

    const relatedRecipes = await getRecipesForIngredient(wholeMilk);

    expect(relatedRecipes.map((recipe) => recipe.name)).toEqual([
      'Clarified Drink',
      'Ordinary Milk Drink',
    ]);
  });
});
