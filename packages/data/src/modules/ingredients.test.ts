import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Source } from '../types/Source.ts';
import {
  getIngredient,
  getIngredientRecipeCounts,
  getSubstitutesForIngredient,
} from './ingredients';
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
  it("lists every bottle sharing any of the ingredient's categories", async () => {
    // Appleton 12 declares Blended aged rum (Jamaica) and Jamaican rum:
    // substitution is bottle-level, so the primary list holds the other
    // members of both — the aged blends and the lighter cuts alike.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'appleton-12'),
    );

    const substituteSlugs = substitution?.substitutes.map(({ slug }) => slug);

    expect(substituteSlugs).toEqual(
      expect.arrayContaining([
        'appleton-21',
        'appleton-8',
        'hamilton-jamaican-pot-still-gold',
        'hampden-estate-46',
        'planteray-2000-jamaican-rum',
        'worthy-park-single-estate',
        // Lighter-aged Jamaican rums share only the broader category.
        'rum-bar-silver',
        'smith-and-cross',
      ]),
    );
    // Each bottle appears once, and the bottle itself never does.
    expect(new Set(substituteSlugs).size).toBe(substituteSlugs?.length);
    expect(substituteSlugs).not.toContain('appleton-12');
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

  it('unions across a sparse category and a populated one', async () => {
    // Wray & Nephew white overproof declares Pot still unaged overproof rum
    // (no other member) and Jamaican rum (12 other members): every member
    // of both supplies the primary list, so the populated shelf shows up.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'wray-and-nephew-white-overproof'),
    );

    expect(substitution?.substitutes.map(({ slug }) => slug)).toContain('rum-bar-silver');
    // The whole populated Jamaican rum shelf shows up, plus the four
    // unaged overproofs sharing the Minimalist Tiki style node.
    expect(substitution?.substitutes).toHaveLength(16);
  });

  it('returns undefined for an ingredient without categories', async () => {
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('juice', 'pineapple-juice'),
    );

    expect(substitution).toBeUndefined();
  });

  it('orders substitutes by recipe count, most-used first', async () => {
    // Spreading recipes[0] directly would carry noUncheckedIndexedAccess's
    // `| undefined` into every property, so pin it to a definite object.
    const [milkDrink] = recipes;
    if (milkDrink === undefined) throw new Error('fixture recipe missing');

    const appleton8Drink: Recipe = {
      ...milkDrink,
      name: 'Appleton 8 drink',
      slug: 'appleton-8-drink',
      ingredients: [
        {
          ...wholeMilk,
          name: 'Appleton 8',
          slug: 'appleton-8',
          type: 'spirit',
          quantity: { amount: 1, unit: 'oz' },
        },
      ],
    };

    // Two recipes reference Appleton 8, one references Appleton 21 (as a
    // milk-clarification material): the more-used bottle leads the
    // substitution list of Appleton 12.
    vi.mocked(getAllRecipes).mockResolvedValue([
      appleton8Drink,
      {
        ...appleton8Drink,
        name: 'Another Appleton 8 drink',
        slug: 'another-appleton-8-drink',
      },
      {
        ...milkDrink,
        name: 'Appleton 21 drink',
        slug: 'appleton-21-drink',
        ingredients: [],
        techniques: [
          {
            technique: 'clarification',
            method: 'milk',
            milk_type: 'Appleton 21',
            quantity: { amount: 4, unit: 'oz' },
          },
        ],
      },
    ]);

    // The substitution result and the recipe counts are both memoized from
    // the earlier tests: clear the shared data caches so this mock takes.
    for (const cache of globalThis.__cocktailsDataCaches ?? []) {
      cache.clear();
    }

    const substitution = await getSubstitutesForIngredient(
      await getIngredient('spirit', 'appleton-12'),
    );

    expect(substitution?.substitutes.map(({ slug }) => slug).at(0)).toBe('appleton-8');

    for (const cache of globalThis.__cocktailsDataCaches ?? []) {
      cache.clear();
    }
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);
  });

  it('returns undefined for a solitary bottle of a parentless category', async () => {
    // Baileys is the only Irish cream and the category sits nowhere in
    // the tree: no sibling bottles, no related categories. An empty
    // drawer is worse than no drawer, so the page gets nothing to
    // render — not a truthy pair of empty lists.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('liqueur', 'baileys'),
    );

    expect(substitution).toBeUndefined();
  });

  it('lists the other umeshu bottles for every umeshu bottle', async () => {
    // All umeshu bottles share the single Umeshu category — the unified
    // canonical home for Japanese plum liqueur — so each one's primary
    // list holds the other three, whatever its own bottle name says.
    const substitution = await getSubstitutesForIngredient(
      await getIngredient('liqueur', 'umenoyado-umeshu'),
    );

    expect(substitution?.substitutes.map(({ slug }) => slug)).toEqual(
      expect.arrayContaining([
        'kamiozumi-umeshu',
        'choya-kokuto-umeshu',
        'tozai-blossom-of-peace',
      ]),
    );
    expect(substitution?.substitutes).toHaveLength(3);
  });
});

describe('getIngredientRecipeCounts', () => {
  beforeEach(() => {
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);
  });

  it('counts each recipe once per ingredient, including clarification materials', async () => {
    const counts = await getIngredientRecipeCounts();

    // Whole milk: the direct reference in Ordinary Milk Drink plus the
    // milk-clarification material in Clarified Drink — two recipes, one
    // count each.
    expect(counts.get('whole-milk')).toBe(2);
    expect(counts.get('coconut-milk')).toBe(1);
    // Recipes with no reference to an ingredient never zero it out.
    expect(counts.get('unheard-of-bottle')).toBeUndefined();
  });
});
