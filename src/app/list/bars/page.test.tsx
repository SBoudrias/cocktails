import { vi, describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import BarsPage from './page';
import { getBarRecipesUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllRecipes } from '@/modules/recipes';

// Helper to get bars from real recipe data
async function getBarsFromRecipes() {
  const allRecipes = await getAllRecipes();
  const barsMap = new Map<
    string,
    { name: string; location?: string; recipeCount: number }
  >();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((attribution) => {
        const mapKey = `${attribution.source}${attribution.location ?? ''}`;
        const bar = barsMap.get(mapKey) || {
          name: attribution.source,
          location: attribution.location,
          recipeCount: 0,
        };
        bar.recipeCount += 1;
        barsMap.set(mapKey, bar);
      });
  });

  return Array.from(barsMap.values());
}

describe('BarsPage', () => {
  it('shows search input, title and list', async () => {
    setupApp(await BarsPage());

    expect(screen.getByText('All Bars')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters bar list by name', async () => {
    const { user } = setupApp(await BarsPage());
    const bars = await getBarsFromRecipes();

    // Find a bar to search for
    const testBar = bars[0]!;

    const input = screen.getByRole('searchbox');
    await user.type(input, testBar.name);

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(testBar.name);
  });

  it('typing filters bar list by location', async () => {
    const { user } = setupApp(await BarsPage());
    const bars = await getBarsFromRecipes();

    // Find a bar with a location to search for
    const barWithLocation = bars.find((bar) => bar.location);
    if (!barWithLocation) {
      // Skip test if no bars have locations in the data
      return;
    }

    const input = screen.getByRole('searchbox');
    await user.type(input, barWithLocation.location!);

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(barWithLocation.name);
  });

  it('shows recipe count for each bar', async () => {
    setupApp(await BarsPage());
    const bars = await getBarsFromRecipes();

    // Check that the recipe count is shown for the first bar
    const testBar = bars[0]!;
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(testBar.name);
    expect(resultList).toHaveTextContent(String(testBar.recipeCount));
  });

  it('clearing search shows all bars grouped by letter', async () => {
    const bars = await getBarsFromRecipes();
    const testBar = bars[0]!;

    const { user } = setupApp(await BarsPage(), {
      nuqsOptions: { searchParams: { search: testBar.name } },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(testBar.name);

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

    // All bars should be visible, grouped by letter
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await BarsPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'bar');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=bar' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await BarsPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /search all recipes/i })).toBeInTheDocument();
  });

  it('bar items link to correct bar detail pages', async () => {
    setupApp(await BarsPage());
    const bars = await getBarsFromRecipes();

    const testBar = bars[0]!;
    const link = screen.getByRole('link', { name: new RegExp(testBar.name, 'i') });
    expect(link).toHaveAttribute('href', getBarRecipesUrl(testBar));
  });

  it('loads with search term from URL', async () => {
    const bars = await getBarsFromRecipes();
    const testBar = bars[0]!;

    setupApp(await BarsPage(), {
      nuqsOptions: { searchParams: { search: testBar.name } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue(testBar.name);

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(testBar.name);
  });

  it('groups bars by first letter when not searching', async () => {
    setupApp(await BarsPage());

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    // Each group should have items
    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('back button navigates correctly', async () => {
    await mockRouter.push('/');
    await mockRouter.push('/list/bars');

    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(await BarsPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('shows bar location as secondary text', async () => {
    setupApp(await BarsPage());
    const bars = await getBarsFromRecipes();

    const barWithLocation = bars.find((bar) => bar.location);
    if (!barWithLocation) {
      // Skip test if no bars have locations in the data
      return;
    }

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(barWithLocation.location!);
  });
});
