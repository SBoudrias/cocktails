import { screen, within } from '@testing-library/react';
import SearchPage from './SearchBar';
import { Recipe } from '@/types/Recipe';
import { renderWithNuqs, setupWithNuqs } from '../../../tools/test-setup';

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

describe('SearchPage', () => {
  beforeEach(() => {
    recipeCounter = 0;
  });

  it('renders search input and recipe list', () => {
    renderWithNuqs(<SearchPage recipes={testRecipes} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
  });

  it('typing in search filters the recipe list', async () => {
    const { user } = setupWithNuqs(<SearchPage recipes={testRecipes} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.queryByText('Daiquiri')).not.toBeInTheDocument();
    expect(screen.queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    const { user } = setupWithNuqs(<SearchPage recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=moj' },
    });

    // Initially filtered
    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.queryByText('Daiquiri')).not.toBeInTheDocument();

    // Clear the search
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // All recipes should be visible, grouped by letter
    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
    expect(screen.getByText('Mai Tai')).toBeInTheDocument();
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupWithNuqs(<SearchPage recipes={testRecipes} />, {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    // Check that URL was updated with search param
    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.queryString).toContain('search=dai');
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupWithNuqs(<SearchPage recipes={testRecipes} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No recipes or ingredients matched/)).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', () => {
    renderWithNuqs(<SearchPage recipes={testRecipes} />);

    const mojitoLink = screen.getByRole('link', { name: /mojito/i });
    expect(mojitoLink).toHaveAttribute('href', '/recipes/book/test-source/recipe-1');
  });

  it('loads with search term from URL', () => {
    renderWithNuqs(<SearchPage recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=margarita' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');
    expect(screen.getByText('Margarita')).toBeInTheDocument();
    expect(screen.queryByText('Mojito')).not.toBeInTheDocument();
  });

  it('groups recipes by first letter when not searching', () => {
    renderWithNuqs(<SearchPage recipes={testRecipes} />);

    // Should have letter headers for D, L (from "The Last Word"), M
    const lists = screen.getAllByRole('list');
    const dGroup = lists.find((list) => within(list).queryByText('D'));
    const mGroup = lists.find((list) => within(list).queryByText('M'));

    expect(dGroup).toBeDefined();
    expect(mGroup).toBeDefined();
  });
});
