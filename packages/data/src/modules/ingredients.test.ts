import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Source } from '../types/Source.ts';
import { getIngredient, getSubstitutesForIngredient } from './ingredients';
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

describe('getSubstitutesForIngredient', () => {
  it('lists only bottles from the most specific category of the ingredient', async () => {
    // Appleton 12 declares Blended aged rum (Jamaica) (depth 3) and Jamaican
    // rum (depth 2): the deeper category wins, so lighter-aged or navy
    // strength Jamaican rums stay out of the primary list.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'appleton-12'),
    );

    expect(substitution?.category.slug).toBe('blended-aged-rum-jamaica');
    expect(substitution?.substitutes.map(({ slug }) => slug)).toEqual([
      'appleton-21',
      'appleton-8',
      'hamilton-jamaican-pot-still-gold',
      'hampden-estate-46',
      'planteray-2000-jamaican-rum',
      'worthy-park-single-estate',
    ]);
  });

  it('lists substitution-friendly sibling categories for the secondary list', async () => {
    // Blended aged rum (Jamaica) sits under Blended aged rum and Jamaican
    // rum: its neighbors are the parents themselves and their other
    // children, minus the bottle's own categories.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'appleton-12'),
    );

    const relatedSlugs = substitution?.relatedCategories.map(({ slug }) => slug);

    expect(relatedSlugs).toEqual(
      expect.arrayContaining([
        'blended-aged-rum',
        'blended-aged-rum-barbados',
        'blended-aged-rum-demerara',
        'blended-lightly-aged-rum-jamaica',
        'jamaican-overproof-rum',
        'navy-strength-jamaican-rum',
      ]),
    );
    // The bottle's own categories never appear as related ones — not even
    // its broader declared category, already linked in the page header.
    expect(relatedSlugs).not.toContain('blended-aged-rum-jamaica');
    expect(relatedSlugs).not.toContain('jamaican-rum');
    // Distant branches of the Rum tree stay out.
    expect(relatedSlugs).not.toContain('rhum-agricole-vieux');
    expect(relatedSlugs).not.toContain('black-blended-rum');
  });

  it('falls back to a broader declared category when the deepest holds no other bottle', async () => {
    // Wray & Nephew white overproof declares Pot still unaged overproof rum
    // (no other member) and Jamaican rum (12 other members): the populated
    // category supplies the primary list.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'wray-and-nephew-white-overproof'),
    );

    expect(substitution?.category.slug).toBe('jamaican-rum');
    expect(substitution?.substitutes.map(({ slug }) => slug)).toContain('rum-bar-silver');
    // The whole populated Jamaican rum shelf shows up, 12 bottles.
    expect(substitution?.substitutes).toHaveLength(12);
  });

  it('returns undefined for an ingredient without categories', async () => {
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('juice', 'pineapple-juice'),
    );

    expect(substitution).toBeUndefined();
  });
});
