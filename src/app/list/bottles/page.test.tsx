import { vi, beforeEach, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import BottlesPage from './page';
import type { RootIngredient } from '@/types/Ingredient';
import { getIngredientUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllIngredients } from '@/modules/ingredients';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
  usePathname: () => '/list/bottles',
}));

vi.mock('@/modules/ingredients', () => ({
  getAllIngredients: vi.fn(),
}));

let bottleCounter = 0;

const mockBottle = (
  name: string,
  type: 'spirit' | 'liqueur' = 'spirit',
): RootIngredient => ({
  name,
  slug: `bottle-${++bottleCounter}`,
  type,
  categories: [],
  refs: [],
  ingredients: [],
});

const testBottles: RootIngredient[] = [
  mockBottle('Appleton Estate 12 Year', 'spirit'),
  mockBottle('Bacardi Superior', 'spirit'),
  mockBottle('Campari', 'liqueur'),
  mockBottle('Cointreau', 'liqueur'),
  mockBottle('El Dorado 12 Year', 'spirit'),
];

beforeEach(() => {
  bottleCounter = 0;
  mockBack.mockClear();
  vi.mocked(getAllIngredients).mockResolvedValue(testBottles);
});

describe('BottlesPage', () => {
  it('renders title and bottle list when not searching', async () => {
    setupApp(await BottlesPage());

    expect(screen.getByText('All Bottles')).toBeInTheDocument();

    const aGroup = screen.getByRole('group', { name: 'A' });
    expect(aGroup).toHaveTextContent('Appleton Estate 12 Year');

    const cGroup = screen.getByRole('group', { name: 'C' });
    expect(cGroup).toHaveTextContent('Campari');
    expect(cGroup).toHaveTextContent('Cointreau');
  });

  it('clicking search icon activates search mode', async () => {
    const { user } = setupApp(await BottlesPage());

    // Initially shows title
    expect(screen.getByText('All Bottles')).toBeInTheDocument();

    // Click search icon
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Now shows search input
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByText('All Bottles')).not.toBeInTheDocument();
  });

  it('typing filters bottle list', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'campari');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Campari');
    expect(resultList).not.toHaveTextContent('Cointreau');
    expect(resultList).not.toHaveTextContent('Appleton');
  });

  it('clearing search shows all bottles grouped by letter', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=campari' },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Campari');
    expect(resultList).not.toHaveTextContent('Cointreau');

    // Close the search (which sets searchTerm to null)
    const closeButton = screen.getByRole('button', { name: /close search/i });
    await user.click(closeButton);

    // All bottles should be visible, grouped by letter
    const aGroup = screen.getByRole('group', { name: 'A' });
    expect(aGroup).toHaveTextContent('Appleton Estate 12 Year');

    const cGroup = screen.getByRole('group', { name: 'C' });
    expect(cGroup).toHaveTextContent('Campari');
    expect(cGroup).toHaveTextContent('Cointreau');
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=', onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'rum');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=rum' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No bottles matched/)).toBeInTheDocument();
  });

  it('bottle items link to correct bottle detail pages', async () => {
    const testBottle = mockBottle('Test Bottle', 'spirit');
    vi.mocked(getAllIngredients).mockResolvedValue([testBottle]);
    setupApp(await BottlesPage());

    const link = screen.getByRole('link', { name: /test bottle/i });
    expect(link).toHaveAttribute('href', getIngredientUrl(testBottle));
  });

  it('loads with search term from URL', async () => {
    setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=bacardi' },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('bacardi');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Bacardi Superior');
    expect(resultList).not.toHaveTextContent('Campari');
  });

  it('groups bottles by first letter when not searching', async () => {
    setupApp(await BottlesPage());

    const aGroup = screen.getByRole('group', { name: 'A' });
    const bGroup = screen.getByRole('group', { name: 'B' });
    const cGroup = screen.getByRole('group', { name: 'C' });
    const eGroup = screen.getByRole('group', { name: 'E' });

    expect(aGroup).toHaveTextContent('Appleton Estate 12 Year');
    expect(bGroup).toHaveTextContent('Bacardi Superior');
    expect(cGroup).toHaveTextContent('Campari');
    expect(cGroup).toHaveTextContent('Cointreau');
    expect(eGroup).toHaveTextContent('El Dorado 12 Year');
  });

  it('back button navigates correctly', async () => {
    const { user } = setupApp(await BottlesPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('only includes spirit and liqueur type ingredients', async () => {
    const spirit = mockBottle('Test Rum', 'spirit');
    const liqueur = mockBottle('Test Liqueur', 'liqueur');
    const syrup: RootIngredient = {
      name: 'Test Syrup',
      slug: 'test-syrup',
      type: 'syrup',
      categories: [],
      refs: [],
      ingredients: [],
    };
    vi.mocked(getAllIngredients).mockResolvedValue([spirit, liqueur, syrup]);
    setupApp(await BottlesPage());

    const tGroup = screen.getByRole('group', { name: 'T' });
    expect(tGroup).toHaveTextContent('Test Rum');
    expect(tGroup).toHaveTextContent('Test Liqueur');
    expect(tGroup).not.toHaveTextContent('Test Syrup');
  });

  it('shows SearchAllLink when searching', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'rum');

    const searchAllLink = screen.getByRole('link', { name: /search all recipes/i });
    expect(searchAllLink).toHaveAttribute('href', '/search?search=rum');
  });

  it('does not show SearchAllLink when not searching', async () => {
    setupApp(await BottlesPage());

    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });
});
