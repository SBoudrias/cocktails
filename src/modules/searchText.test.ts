import { describe, it, expect } from 'vitest';
import {
  getRecipeSearchText,
  getNameSearchText,
  getIngredientSearchText,
  getAttributionSearchText,
} from './searchText';
import { Recipe } from '@/types/Recipe';
import { RootIngredient, RecipeIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';

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

function createMockIngredient(overrides: Partial<RootIngredient> = {}): RootIngredient {
  return {
    name: 'Test Ingredient',
    slug: 'test-ingredient',
    type: 'spirit',
    categories: [],
    refs: [],
    ingredients: [],
    ...overrides,
  };
}

describe('getRecipeSearchText', () => {
  it('includes recipe name', () => {
    const recipe = createMockRecipe({ name: 'Daiquiri' });
    const result = getRecipeSearchText(recipe);
    expect(result).toContain('daiquiri');
  });

  it('includes ingredient names', () => {
    const recipe = createMockRecipe({
      ingredients: [
        createMockRecipeIngredient({ name: 'White Rum' }),
        createMockRecipeIngredient({ name: 'Lime Juice' }),
      ],
    });
    const result = getRecipeSearchText(recipe);
    expect(result).toContain('white rum');
    expect(result).toContain('lime juice');
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
    const result = getRecipeSearchText(recipe);
    expect(result).toContain('aged rum');
  });

  it('includes attribution sources', () => {
    const recipe = createMockRecipe({
      attributions: [
        { relation: 'bar', source: "Smuggler's Cove", location: 'San Francisco' },
        { relation: 'recipe author', source: 'Martin Cate' },
      ],
    });
    const result = getRecipeSearchText(recipe);
    expect(result).toContain("smuggler's cove");
    expect(result).toContain('martin cate');
  });

  it('transliterates special characters', () => {
    const recipe = createMockRecipe({ name: 'Café Cubano' });
    const result = getRecipeSearchText(recipe);
    expect(result).toContain('cafe cubano');
  });

  it('returns lowercase text', () => {
    const recipe = createMockRecipe({ name: 'MAI TAI' });
    const result = getRecipeSearchText(recipe);
    expect(result).toBe(result.toLowerCase());
  });
});

describe('getNameSearchText', () => {
  it('returns transliterated lowercase name', () => {
    const result = getNameSearchText({ name: 'Café Martini' });
    expect(result).toBe('cafe martini');
  });

  it('handles plain ascii names', () => {
    const result = getNameSearchText({ name: 'Old Fashioned' });
    expect(result).toBe('old fashioned');
  });
});

describe('getIngredientSearchText', () => {
  it('includes ingredient name', () => {
    const ingredient = createMockIngredient({ name: 'Jamaican Rum' });
    const result = getIngredientSearchText(ingredient);
    expect(result).toContain('jamaican rum');
  });

  it('includes category names', () => {
    const ingredient = createMockIngredient({
      name: 'Appleton Estate 8 Year',
      categories: [mockCategory],
    });
    const result = getIngredientSearchText(ingredient);
    expect(result).toContain('aged rum');
  });

  it('returns lowercase text', () => {
    const ingredient = createMockIngredient({ name: 'OVERPROOF RUM' });
    const result = getIngredientSearchText(ingredient);
    expect(result).toBe(result.toLowerCase());
  });
});

describe('getAttributionSearchText', () => {
  it('includes name', () => {
    const result = getAttributionSearchText({ name: "Smuggler's Cove" });
    expect(result).toContain("smuggler's cove");
  });

  it('includes location when present', () => {
    const result = getAttributionSearchText({
      name: 'Death & Co',
      location: 'New York',
    });
    expect(result).toContain('death & co');
    expect(result).toContain('new york');
  });

  it('handles missing location', () => {
    const result = getAttributionSearchText({ name: 'Test Bar' });
    expect(result).toBe('test bar');
  });

  it('returns lowercase text', () => {
    const result = getAttributionSearchText({
      name: 'THE BAR',
      location: 'LOS ANGELES',
    });
    expect(result).toBe(result.toLowerCase());
  });
});
