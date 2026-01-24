import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { getAllIngredients } from '@/modules/ingredients';
import { getIngredientUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import BottlesPage from './page';

describe('BottlesPage', () => {
  it('shows search input, title and list', async () => {
    setupApp(await BottlesPage());

    expect(screen.getByText('All Bottles')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters bottle list', async () => {
    const { user } = setupApp(await BottlesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'campari');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(/campari/i);
  });

  it('filters bottles by category name', async () => {
    const { user } = setupApp(await BottlesPage());

    const input = screen.getByRole('searchbox');
    // Search by category - "Jamaican" is a category for several rums
    await user.type(input, 'jamaican');

    const resultList = screen.getByRole('list');
    // Should find bottles categorized as Jamaican Rum
    expect(resultList).toHaveTextContent(/appleton/i);
  });

  it('clearing search shows all bottles grouped by letter', async () => {
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: { search: 'rum' } },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(/rum/i);

    // Clear the search input
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('rum');
    await user.clear(input);

    // All bottles should be visible, grouped by letter
    expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await BottlesPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'gin');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=gin' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await BottlesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('does not show SearchAllLink when no results (not searching recipes)', async () => {
    const { user } = setupApp(await BottlesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });

  it('bottle items link to correct ingredient detail pages', async () => {
    setupApp(await BottlesPage());

    const allIngredients = await getAllIngredients();
    const bottles = allIngredients.filter(
      (i) => i.type === 'liqueur' || i.type === 'spirit',
    );
    const testBottle = bottles[0]!;

    const link = screen.getByRole('link', { name: new RegExp(testBottle.name, 'i') });
    expect(link).toHaveAttribute('href', getIngredientUrl(testBottle));
  });

  it('loads with search term from URL', async () => {
    setupApp(await BottlesPage(), {
      nuqsOptions: { searchParams: { search: 'vodka' } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('vodka');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(/vodka/i);
  });

  it('groups bottles by first letter when not searching', async () => {
    setupApp(await BottlesPage());

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('home button navigates to home', async () => {
    await mockRouter.push('/list/bottles');

    setupApp(await BottlesPage());

    const homeButton = screen.getByRole('link', { name: /go to home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it('only shows liqueur and spirit type ingredients', async () => {
    setupApp(await BottlesPage());

    const allIngredients = await getAllIngredients();
    const nonBottles = allIngredients.filter(
      (i) => i.type !== 'liqueur' && i.type !== 'spirit',
    );

    const list = screen.getByRole('list');

    // Verify non-bottle ingredients are NOT shown
    for (const ingredient of nonBottles.slice(0, 3)) {
      expect(list).not.toHaveTextContent(ingredient.name);
    }
  });

  it('shows both spirits and liqueurs in the list', async () => {
    setupApp(await BottlesPage());

    const allIngredients = await getAllIngredients();
    const spirits = allIngredients.filter((i) => i.type === 'spirit');
    const liqueurs = allIngredients.filter((i) => i.type === 'liqueur');

    const list = screen.getByRole('list');

    // Verify at least one spirit and one liqueur are shown
    if (spirits.length > 0) {
      const sampleSpirit = spirits[0]!;
      expect(list).toHaveTextContent(sampleSpirit.name);
    }
    if (liqueurs.length > 0) {
      const sampleLiqueur = liqueurs[0]!;
      expect(list).toHaveTextContent(sampleLiqueur.name);
    }
  });
});
