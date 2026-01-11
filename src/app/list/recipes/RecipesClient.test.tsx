import { screen } from '@testing-library/react';
import RecipesPage from './page';
import { Recipe } from '@/types/Recipe';
import { getRecipeUrl } from '@/modules/url';
import { renderWithNuqs, setupWithNuqs } from '@/testing';

vi.mock('@/modules/recipes', () => ({
  getAllRecipes: vi.fn(),
}));

import { getAllRecipes } from '@/modules/recipes';

const mockHistoryBack = vi.fn();
Object.defineProperty(window, 'history', {
  value: { back: mockHistoryBack },
  writable: true,
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

const testRecipes: Recipe[] = [
  mockRecipe('Mojito'),
  mockRecipe('Margarita'),
  mockRecipe('Mai Tai'),
  mockRecipe('Daiquiri'),
  mockRecipe('The Last Word'),
];

describe('RecipesPage', () => {
  beforeEach(() => {
    recipeCounter = 0;
    vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
  });

  it('renders search input and recipe list', async () => {
    renderWithNuqs(await RecipesPage());

    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');
  });

  it('typing in search filters the recipe list', async () => {
    const { user } = setupWithNuqs(await RecipesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');
    expect(resultList).not.toHaveTextContent('Margarita');
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    const { user } = setupWithNuqs(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=moj' },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');

    // Clear the search
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // All recipes should be visible, grouped by letter
    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Mai Tai');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupWithNuqs(await RecipesPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    // Check that URL was updated with search param
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=dai' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupWithNuqs(await RecipesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No recipes or ingredients matched/)).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', async () => {
    const mojito = mockRecipe('Test Recipe');
    vi.mocked(getAllRecipes).mockResolvedValue([mojito]);
    renderWithNuqs(await RecipesPage());

    const link = screen.getByRole('link', { name: /test recipe/i });
    expect(link).toHaveAttribute('href', getRecipeUrl(mojito));
  });

  it('loads with search term from URL', async () => {
    renderWithNuqs(await RecipesPage(), {
      nuqsOptions: { searchParams: '?search=margarita' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');

    // Select the result list and check its text content
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('groups recipes by first letter when not searching', async () => {
    renderWithNuqs(await RecipesPage());

    // Groups are identified by aria-labelledby pointing to their header
    const dGroup = screen.getByRole('group', { name: 'D' });
    const lGroup = screen.getByRole('group', { name: 'L' });
    const mGroup = screen.getByRole('group', { name: 'M' });

    expect(dGroup).toHaveTextContent('Daiquiri');
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
  });
});
