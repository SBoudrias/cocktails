import type { Category, Recipe, RecipeIngredient } from '@cocktails/data';
import { describe, it, expect } from 'vitest';
import { getRecipeSearchText } from './searchText';

const mockCategory: Category = {
  name: 'Aged Rum',
  slug: 'aged-rum',
  parents: [],
  refs: [],
  type: 'category',
};

const mockSource = {
  type: 'book' as const,
  name: 'Test Book',
  slug: 'test-book',
  link: 'https://example.com',
  description: 'Test description',
  recipeAmount: 1,
};

function createMockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    name: 'Test Recipe',
    slug: 'test-recipe',
    preparation: 'shaken',
    served_on: 'up',
    glassware: 'coupe',
    ingredients: [],
    source: mockSource,
    attributions: [],
    refs: [],
    ...overrides,
  };
}

function createMockRecipeIngredient(
  overrides: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return {
    name: 'Test Ingredient',
    slug: 'test-ingredient',
    type: 'spirit',
    categories: [],
    refs: [],
    ingredients: [],
    quantity: { amount: 1, unit: 'oz' },
    ...overrides,
  } as RecipeIngredient;
}

describe('getRecipeSearchText', () => {
  it('includes recipe name', () => {
    const recipe = createMockRecipe({ name: 'Daiquiri' });
    expect(getRecipeSearchText(recipe)).toMatchInlineSnapshot(`"daiquiri"`);
  });

  it('includes ingredient names', () => {
    const recipe = createMockRecipe({
      ingredients: [
        createMockRecipeIngredient({ name: 'White Rum' }),
        createMockRecipeIngredient({ name: 'Lime Juice' }),
      ],
    });
    expect(getRecipeSearchText(recipe)).toMatchInlineSnapshot(
      `"test recipe white rum  lime juice"`,
    );
  });

  it('includes category names from ingredients', () => {
    const recipe = createMockRecipe({
      ingredients: [
        createMockRecipeIngredient({
          name: 'Appleton Estate 8 Year',
          categories: [mockCategory],
        }),
      ],
    });
    expect(getRecipeSearchText(recipe)).toMatchInlineSnapshot(
      `"test recipe appleton estate 8 year aged rum"`,
    );
  });

  it('includes attribution sources', () => {
    const recipe = createMockRecipe({
      attributions: [
        { relation: 'bar', source: "Smuggler's Cove", location: 'San Francisco' },
        { relation: 'recipe author', source: 'Martin Cate' },
      ],
    });
    expect(getRecipeSearchText(recipe)).toMatchInlineSnapshot(
      `"test recipe  smuggler's cove martin cate"`,
    );
  });

  it('transliterates special characters', () => {
    const recipe = createMockRecipe({ name: 'Café Cubano' });
    expect(getRecipeSearchText(recipe)).toMatchInlineSnapshot(`"cafe cubano"`);
  });
});
