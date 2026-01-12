import { vi, beforeEach, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import RecipesPage from './page';
import type { Recipe } from '@/types/Recipe';
import { getRecipeUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllRecipes } from '@/modules/recipes';

vi.mock('@/modules/recipes', () => ({
  getAllRecipes: vi.fn(),
}));

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

const testRecipes: Recipe[] = [
  mockRecipe('Mojito'),
  mockRecipe('Margarita'),
  mockRecipe('Mai Tai'),
  mockRecipe('Daiquiri'),
  mockRecipe('The Last Word'),
];

beforeEach(() => {
  recipeCounter = 0;
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
});

describe('RecipesPage', () => {
  it('renders title and recipe list when not searching', async () => {
    setupApp(await RecipesPage());

    expect(screen.getByText('All Recipes')).toBeInTheDocument();

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');
  });

  it('shows search input and title together', async () => {
    setupApp(await RecipesPage());

    // Both title and search input are always visible
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('typing filters recipe list', async () => {
    const { user } = setupApp(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');
    expect(resultList).not.toHaveTextContent('Margarita');
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    const { user } = setupApp(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=moj' },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

    // All recipes should be visible, grouped by letter
    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Mai Tai');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=', onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=dai' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No recipes or ingredients matched/)).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', async () => {
    const mojito = mockRecipe('Test Recipe');
    vi.mocked(getAllRecipes).mockResolvedValue([mojito]);
    setupApp(await RecipesPage());

    const link = screen.getByRole('link', { name: /test recipe/i });
    expect(link).toHaveAttribute('href', getRecipeUrl(mojito));
  });

  it('loads with search term from URL', async () => {
    setupApp(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=margarita' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('groups recipes by first letter when not searching', async () => {
    setupApp(await RecipesPage());

    const dGroup = screen.getByRole('group', { name: 'D' });
    const lGroup = screen.getByRole('group', { name: 'L' });
    const mGroup = screen.getByRole('group', { name: 'M' });

    expect(dGroup).toHaveTextContent('Daiquiri');
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
  });

  it('back button navigates correctly', async () => {
    // Build navigation history with two pushes
    await mockRouter.push('/');
    await mockRouter.push('/list/recipes');

    // Spy on back to verify it's called (next-router-mock doesn't maintain actual history)
    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(await RecipesPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });
});
