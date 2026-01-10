import { screen } from '@testing-library/react';
import RecipesClient from './RecipesClient';
import { Recipe } from '@/types/Recipe';
import { getRecipeUrl } from '@/modules/url';
import { renderWithNuqs, setupWithNuqs } from '@/testing';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
  usePathname: () => '/list/recipes',
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

describe('RecipesClient', () => {
  beforeEach(() => {
    recipeCounter = 0;
    mockBack.mockClear();
  });

  it('renders title and recipe list when not searching', () => {
    renderWithNuqs(<RecipesClient recipes={testRecipes} />);

    expect(screen.getByText('All Recipes')).toBeInTheDocument();

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');
  });

  it('clicking search icon activates search mode', async () => {
    const { user } = setupWithNuqs(<RecipesClient recipes={testRecipes} />);

    // Initially shows title
    expect(screen.getByText('All Recipes')).toBeInTheDocument();

    // Click search icon
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Now shows search input
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByText('All Recipes')).not.toBeInTheDocument();
  });

  it('typing filters recipe list', async () => {
    const { user } = setupWithNuqs(<RecipesClient recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');
    expect(resultList).not.toHaveTextContent('Margarita');
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupWithNuqs(<RecipesClient recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=', onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=dai' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupWithNuqs(<RecipesClient recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No recipes matched/)).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', () => {
    const mojito = mockRecipe('Test Recipe');
    renderWithNuqs(<RecipesClient recipes={[mojito]} />);

    const link = screen.getByRole('link', { name: /test recipe/i });
    expect(link).toHaveAttribute('href', getRecipeUrl(mojito));
  });

  it('loads with search term from URL', () => {
    renderWithNuqs(<RecipesClient recipes={testRecipes} />, {
      nuqsOptions: { searchParams: '?search=margarita' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('groups recipes by first letter when not searching', () => {
    renderWithNuqs(<RecipesClient recipes={testRecipes} />);

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
    const { user } = setupWithNuqs(<RecipesClient recipes={testRecipes} />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });
});
