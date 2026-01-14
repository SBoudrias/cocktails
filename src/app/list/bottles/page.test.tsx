import { vi, beforeEach, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import BottlesPage from './page';
import type { RootIngredient } from '@/types/Ingredient';
import { getIngredientUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllIngredients } from '@/modules/ingredients';

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

  it('shows search input and title together', async () => {
    setupApp(await BottlesPage());

    // Both title and search input are always visible
    expect(screen.getByText('All Bottles')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
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

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

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
    // Build navigation history with two pushes
    await mockRouter.push('/');
    await mockRouter.push('/list/bottles');

    // Spy on back to verify it's called (next-router-mock doesn't maintain actual history)
    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(await BottlesPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
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

  it('shows SearchAllLink when no results found', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznotfound');

    const searchAllLink = screen.getByRole('link', { name: /search all recipes/i });
    expect(searchAllLink).toHaveAttribute('href', '/search?search=xyznotfound');
  });

  it('does not show SearchAllLink when results exist', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: '?search=' },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'campari');

    // Results should be found
    expect(screen.getByRole('list')).toHaveTextContent('Campari');

    // SearchAllLink should not be shown when there are results
    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });
});
