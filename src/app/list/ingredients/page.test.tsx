import { vi, beforeEach, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import IngredientsPage from './page';
import type { RootIngredient } from '@/types/Ingredient';
import type { Category } from '@/types/Category';
import { getIngredientUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllIngredients } from '@/modules/ingredients';
import { getAllCategories } from '@/modules/categories';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
  usePathname: () => '/list/ingredients',
}));

// Note: Global mock for next/navigation is in test-setup.ts, but we override here
// because the mockBack function needs to be accessible for the back button test

vi.mock('@/modules/ingredients', () => ({
  getAllIngredients: vi.fn(),
}));

vi.mock('@/modules/categories', () => ({
  getAllCategories: vi.fn(),
}));

let ingredientCounter = 0;

const mockIngredient = (
  name: string,
  type: RootIngredient['type'] = 'syrup',
): RootIngredient => ({
  name,
  slug: `ingredient-${++ingredientCounter}`,
  type,
  categories: [],
  refs: [],
  ingredients: [],
});

const mockCategory = (name: string): Category => ({
  name,
  slug: `category-${++ingredientCounter}`,
  type: 'category',
  parents: [],
  refs: [],
});

const testIngredients: RootIngredient[] = [
  mockIngredient('Simple Syrup'),
  mockIngredient('Honey Syrup'),
  mockIngredient('Lime Juice', 'juice'),
  mockIngredient('Lemon Juice', 'juice'),
  mockIngredient('Angostura Bitters', 'bitter'),
];

const testCategories: Category[] = [
  mockCategory('Gin'),
  mockCategory('Rum'),
  mockCategory('Whiskey'),
];

beforeEach(() => {
  ingredientCounter = 0;
  mockBack.mockClear();
  vi.mocked(getAllIngredients).mockResolvedValue(testIngredients);
  vi.mocked(getAllCategories).mockResolvedValue(testCategories);
});

describe('IngredientsPage', () => {
  it('renders title and ingredient list when not searching', async () => {
    setupApp(await IngredientsPage());

    expect(screen.getByText('All Ingredients')).toBeInTheDocument();

    const sGroup = screen.getByRole('group', { name: 'S' });
    expect(sGroup).toHaveTextContent('Simple Syrup');

    const gGroup = screen.getByRole('group', { name: 'G' });
    expect(gGroup).toHaveTextContent('Gin');
  });

  it('shows search input and title together', async () => {
    setupApp(await IngredientsPage());

    // Both title and search input are always visible
    expect(screen.getByText('All Ingredients')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('typing filters ingredient list', async () => {
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'honey');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Honey Syrup');
    expect(resultList).not.toHaveTextContent('Simple Syrup');
    expect(resultList).not.toHaveTextContent('Lime Juice');
  });

  it('clearing search shows all ingredients grouped by letter', async () => {
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: '?search=honey' },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Honey Syrup');
    expect(resultList).not.toHaveTextContent('Simple Syrup');

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

    // All ingredients should be visible, grouped by letter
    const sGroup = screen.getByRole('group', { name: 'S' });
    expect(sGroup).toHaveTextContent('Simple Syrup');

    const hGroup = screen.getByRole('group', { name: 'H' });
    expect(hGroup).toHaveTextContent('Honey Syrup');
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: '?search=', onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'gin');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=gin' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No ingredients matched/)).toBeInTheDocument();
  });

  it('ingredient items link to correct ingredient detail pages', async () => {
    const testIngredient = mockIngredient('Test Ingredient', 'syrup');
    vi.mocked(getAllIngredients).mockResolvedValue([testIngredient]);
    vi.mocked(getAllCategories).mockResolvedValue([]);
    setupApp(await IngredientsPage());

    const link = screen.getByRole('link', { name: /test ingredient/i });
    expect(link).toHaveAttribute('href', getIngredientUrl(testIngredient));
  });

  it('category items link to correct category pages', async () => {
    const testCategory = mockCategory('Test Category');
    vi.mocked(getAllIngredients).mockResolvedValue([]);
    vi.mocked(getAllCategories).mockResolvedValue([testCategory]);
    setupApp(await IngredientsPage());

    const link = screen.getByRole('link', { name: /test category/i });
    expect(link).toHaveAttribute('href', getIngredientUrl(testCategory));
  });

  it('loads with search term from URL', async () => {
    setupApp(await IngredientsPage(), {
      nuqsOptions: { searchParams: '?search=lime' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('lime');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Lime Juice');
    expect(resultList).not.toHaveTextContent('Simple Syrup');
  });

  it('groups ingredients by first letter when not searching', async () => {
    setupApp(await IngredientsPage());

    const aGroup = screen.getByRole('group', { name: 'A' });
    const hGroup = screen.getByRole('group', { name: 'H' });
    const lGroup = screen.getByRole('group', { name: 'L' });
    const sGroup = screen.getByRole('group', { name: 'S' });

    expect(aGroup).toHaveTextContent('Angostura Bitters');
    expect(hGroup).toHaveTextContent('Honey Syrup');
    expect(lGroup).toHaveTextContent('Lime Juice');
    expect(lGroup).toHaveTextContent('Lemon Juice');
    expect(sGroup).toHaveTextContent('Simple Syrup');
  });

  it('back button navigates correctly', async () => {
    const { user } = setupApp(await IngredientsPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('filters out liqueur and spirit type ingredients', async () => {
    const liqueur = mockIngredient('Triple Sec', 'liqueur');
    const spirit = mockIngredient('Bourbon', 'spirit');
    const syrup = mockIngredient('Maple Syrup', 'syrup');
    vi.mocked(getAllIngredients).mockResolvedValue([liqueur, spirit, syrup]);
    vi.mocked(getAllCategories).mockResolvedValue([]);
    setupApp(await IngredientsPage());

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Maple Syrup');
    expect(screen.queryByRole('group', { name: 'T' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'B' })).not.toBeInTheDocument();
  });

  it('combines ingredients and categories in the list', async () => {
    const syrup = mockIngredient('Simple Syrup', 'syrup');
    const category = mockCategory('Rum');
    vi.mocked(getAllIngredients).mockResolvedValue([syrup]);
    vi.mocked(getAllCategories).mockResolvedValue([category]);
    setupApp(await IngredientsPage());

    const sGroup = screen.getByRole('group', { name: 'S' });
    expect(sGroup).toHaveTextContent('Simple Syrup');

    const rGroup = screen.getByRole('group', { name: 'R' });
    expect(rGroup).toHaveTextContent('Rum');
  });
});
