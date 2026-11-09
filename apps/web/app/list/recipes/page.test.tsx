import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { screen, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, beforeEach, describe, it } from 'vitest';
import { buildSearchIndex, toSearchIndexItems } from '#/modules/buildSearchIndex';
import { resetSearchIndexCache } from '#/modules/searchIndex';
import { getRecipeLetterUrl, getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import RecipesPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getAllRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string, overrides: Partial<Recipe> = {}): Recipe => ({
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
  ...overrides,
});

const testRecipes: Recipe[] = [
  mockRecipe('Mojito'),
  mockRecipe('Margarita'),
  mockRecipe('Mai Tai'),
  mockRecipe('Daiquiri'),
  mockRecipe('The Last Word', {
    attributions: [{ relation: 'recipe author', source: 'Jane Doe' }],
  }),
  mockRecipe('20th Century'),
];

beforeEach(() => {
  resetSearchIndexCache();
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
  vi.mocked(fetch).mockResolvedValue(
    Response.json(buildSearchIndex(toSearchIndexItems(testRecipes))),
  );
});

describe('RecipesPage', () => {
  it('lists the letter pages with their recipe count', async () => {
    setupApp(await RecipesPage());

    expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^M\b/ })).toHaveAttribute(
      'href',
      getRecipeLetterUrl('m'),
    );
    expect(screen.getByRole('link', { name: /^M\b/ })).toHaveTextContent('3 recipes');
    expect(screen.getByRole('link', { name: /^L\b/ })).toHaveTextContent('1 recipe');
    expect(screen.getByRole('link', { name: /^#/ })).toHaveAttribute(
      'href',
      getRecipeLetterUrl('0-9'),
    );
    // The index page lists letters, not recipes.
    expect(screen.queryByRole('link', { name: /mojito/i })).not.toBeInTheDocument();
  });

  it('searches every recipe through the shared search index', async () => {
    mockRouter.setCurrentUrl('?search=margarita');
    setupApp(await RecipesPage());

    expect(screen.getByRole('searchbox')).toHaveValue('margarita');
    expect(screen.getByRole('status')).toHaveTextContent('Searching all recipes…');

    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Margarita');
    });
    expect(screen.getByRole('list')).not.toHaveTextContent('Mojito');
    expect(screen.getByRole('link', { name: /margarita/i })).toHaveAttribute(
      'href',
      getRecipeUrl(testRecipes[1]!),
    );
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('matches beyond the name', async () => {
    mockRouter.setCurrentUrl('?search=jane%20doe');
    setupApp(await RecipesPage());

    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('The Last Word');
    });
  });

  it('typing searches and updates the URL', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await RecipesPage(), { nuqsOptions: { onUrlUpdate } });

    await user.type(screen.getByRole('searchbox'), 'dai');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=dai' }),
    );
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Daiquiri');
    });
  });

  it('shows no results when search has no matches', async () => {
    mockRouter.setCurrentUrl('?search=xyznonexistent');
    setupApp(await RecipesPage());

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
    expect(screen.getByText(/No recipes or ingredients matched/)).toBeInTheDocument();
  });

  it('clearing search shows the letters again', async () => {
    mockRouter.setCurrentUrl('?search=moj');
    const { user } = setupApp(await RecipesPage());
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Mojito');
    });

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByRole('link', { name: /^M\b/ })).toHaveTextContent('3 recipes');
  });
});
