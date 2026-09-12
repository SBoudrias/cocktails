import type { Recipe } from '@cocktails/data';
import { getMilkClarifiedRecipes } from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import MilkClarificationRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getMilkClarifiedRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: {
    type: 'book',
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
  techniques: [
    {
      technique: 'clarification',
      method: 'milk',
      milk_type: 'Whole milk',
      quantity: { amount: 5, unit: 'oz' },
    },
  ],
});

const testRecipes: Recipe[] = [
  mockRecipe('Clarified New York Sour'),
  mockRecipe('After Eight'),
];

beforeEach(() => {
  recipeCounter = 0;
  vi.mocked(getMilkClarifiedRecipes).mockResolvedValue(testRecipes);
});

describe('MilkClarificationRecipesPage', () => {
  it('renders the searchable milk-clarified recipe list', async () => {
    setupApp(await MilkClarificationRecipesPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Milk-Clarified Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /clarified new york sour/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /after eight/i })).toBeInTheDocument();
  });

  it('links to recipe detail pages', async () => {
    const recipe = mockRecipe('Test Recipe');
    vi.mocked(getMilkClarifiedRecipes).mockResolvedValue([recipe]);

    setupApp(await MilkClarificationRecipesPage());

    expect(screen.getByRole('link', { name: /test recipe/i })).toHaveAttribute(
      'href',
      getRecipeUrl(recipe),
    );
  });
});
