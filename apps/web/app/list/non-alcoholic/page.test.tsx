import type { Recipe } from '@cocktails/data';
import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import NonAlcoholicRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getNonAlcoholicRecipes: vi.fn(),
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
});

const testRecipes: Recipe[] = [mockRecipe('Bitters and Soda'), mockRecipe('Ginger Lime')];

beforeEach(() => {
  recipeCounter = 0;
  vi.mocked(getNonAlcoholicRecipes).mockResolvedValue(testRecipes);
});

describe('NonAlcoholicRecipesPage', () => {
  it('renders the searchable non-alcoholic recipe list', async () => {
    setupApp(await NonAlcoholicRecipesPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Non-Alcoholic Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /bitters and soda/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ginger lime/i })).toBeInTheDocument();
  });

  it('links to recipe detail pages', async () => {
    const recipe = mockRecipe('Test Recipe');
    vi.mocked(getNonAlcoholicRecipes).mockResolvedValue([recipe]);

    setupApp(await NonAlcoholicRecipesPage());

    expect(screen.getByRole('link', { name: /test recipe/i })).toHaveAttribute(
      'href',
      getRecipeUrl(recipe),
    );
  });
});
