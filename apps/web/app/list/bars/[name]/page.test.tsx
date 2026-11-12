import { getRecipe, getRecipesByBar } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { hangJson, serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import BarRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getRecipesByBar: vi.fn(),
}));

// Real recipes: the list rows render their name and source label, so the
// fixtures double as the content the assertions below look for.
const [derbyDaiquiri, lastRites, pocoCocoLoco] = await Promise.all([
  getRecipe({ type: 'book', slug: 'sippin-safari' }, 'derby-daiquiri'),
  getRecipe({ type: 'book', slug: 'sippin-safari' }, 'last-rites'),
  getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'poco-coco-loco'),
]);

/** The recipes the tested bars' pages list, keyed by bar slug. */
const barRecipes: Record<string, (typeof derbyDaiquiri)[]> = {
  'mai-kai-fort-lauderdale-fl': [derbyDaiquiri, lastRites],
  'trader-vics': [pocoCocoLoco],
};

/** The catalog as the bar pages read it: the tested bars' lists. */
const testCatalog = buildCatalog(
  Object.entries(barRecipes).map(([slug, recipes]) => ({
    key: `list/bars/${slug}`,
    recipes,
    pickQuantity: () => undefined,
  })),
);

beforeEach(() => {
  mockRouter.setCurrentUrl('/');
  vi.mocked(getRecipesByBar).mockImplementation(
    async (bar) => barRecipes[bar.slug] ?? [],
  );
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('BarRecipesPage', () => {
  it('renders the About card with location, description, website and map links', async () => {
    await setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'mai-kai-fort-lauderdale-fl' }),
      }),
    );

    expect(screen.getByText('Fort Lauderdale, FL')).toBeInTheDocument();
    // The recipe list title carries the bar's short name; the location stays
    // in the card.
    expect(screen.getByText('Recipes from Mai-Kai')).toBeInTheDocument();
    expect(
      screen.getByText(/Polynesian-themed restaurant and tiki bar/i),
    ).toBeInTheDocument();

    const websiteLink = screen.getByRole('link', { name: /mai-kai\.com/i });
    expect(websiteLink).toHaveAttribute('href', 'https://mai-kai.com');

    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink.getAttribute('href')).toContain('https://www.google.com/maps/search/');
  });

  it('renders the card header for a name-only bar, without extra links', async () => {
    await setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'trader-vics' }),
      }),
    );

    expect(screen.getAllByText("Trader Vic's")).toHaveLength(1);
    expect(screen.queryByRole('link', { name: /map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /\.com/i })).not.toBeInTheDocument();
  });
});

describe('BarRecipesPage catalog-driven recipe list', () => {
  /**
   * The recipe rows' list group, however many other lists the page shows.
   * Its aria-labelledby id has spaces, which breaks the accessible name, so
   * walk up from the subheader text instead.
   */
  function getRecipeList(): HTMLElement {
    const subheader = screen.getByText('Recipes from Mai-Kai');
    const list = subheader.closest('[role="group"]');
    if (!(list instanceof HTMLElement)) {
      throw new Error('recipe list group not found');
    }
    return list;
  }

  it('shows the loading state before the catalog lands', async () => {
    sharedJsonServer.use(hangJson('/data/catalog.json'));

    await setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'mai-kai-fort-lauderdale-fl' }),
      }),
    );

    // The reserved space is there at once; the skeleton rows wait out
    // their grace period.
    expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
    expect(screen.queryByText('Derby Daiquiri')).not.toBeInTheDocument();
  });

  it('renders the full list from the catalog once loaded', async () => {
    await setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'mai-kai-fort-lauderdale-fl' }),
      }),
    );

    // setupApp flushes the catalog load: the rows and header are already there.
    const list = getRecipeList();
    expect(list).toHaveTextContent('Derby Daiquiri');
    expect(list).toHaveTextContent('Last Rites');
  });

  it('search filters the recipes within the bar', async () => {
    const { user } = await setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'mai-kai-fort-lauderdale-fl' }),
      }),
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'derby');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Derby Daiquiri');
    expect(resultList).not.toHaveTextContent('Last Rites');
  });

  // The catalog list's other states — loading while a search is active, the
  // reload affordance after a failed fetch — are shared SearchableRecipePage
  // behavior, covered once on the category page.
});
