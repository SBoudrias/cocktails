import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { vi, afterEach, beforeEach, describe, it } from 'vitest';
// The app's client setup: enables nuqs history sync, as in the browser.
import '#/instrumentation-client';
import { buildSearchIndex, toSearchIndexItems } from '#/modules/buildSearchIndex';
import { resetSearchIndexCache } from '#/modules/searchIndex';
import { getRecipeLetterUrl, getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import RecipesPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getAllRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string, overrides: Partial<Recipe> = {}): Recipe => ({
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
  ...overrides,
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
  resetSearchIndexCache();
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
});

describe('RecipesPage', () => {
  it('renders search input and recipe list', async () => {
    setupApp(await RecipesPage());

    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');

    const dGroup = screen.getByRole('group', { name: 'D' });
    expect(dGroup).toHaveTextContent('Daiquiri');

    expect(screen.getAllByText('Test Source')).toHaveLength(testRecipes.length);
  });

  it('links each letter page above the full list', async () => {
    setupApp(await RecipesPage());

    const nav = screen.getByRole('navigation', { name: 'Recipes by letter' });
    expect(within(nav).getByRole('link', { name: 'M' })).toHaveAttribute(
      'href',
      getRecipeLetterUrl('m'),
    );
    expect(within(nav).getByRole('link', { name: 'D' })).toHaveAttribute(
      'href',
      getRecipeLetterUrl('d'),
    );
    expect(within(nav).queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
    // The full list stays on this page.
    expect(screen.getByRole('group', { name: 'M' })).toHaveTextContent('Mojito');
  });

  it('hides the letter links while searching', async () => {
    mockRouter.setCurrentUrl('?search=margarita');
    setupApp(await RecipesPage());

    expect(
      screen.queryByRole('navigation', { name: 'Recipes by letter' }),
    ).not.toBeInTheDocument();
  });

  it('always identifies recipes by source and book chapter', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue([
      mockRecipe('Book Chapter Recipe', {
        chapter: { order: 1, name: 'Classic Cocktails' },
        attributions: [
          { relation: 'recipe author', source: 'Recipe Author' },
          { relation: 'bar', source: 'Some Bar' },
        ],
      }),
      mockRecipe('Book Recipe'),
      mockRecipe('YouTube Recipe', {
        source: {
          type: 'youtube-channel',
          name: 'Test Channel',
          slug: 'test-channel',
          links: ['https://example.com'],
          description: 'Test description',
          recipeAmount: 1,
        },
      }),
      mockRecipe('Podcast Recipe', {
        source: {
          type: 'podcast',
          name: 'Test Podcast',
          slug: 'test-podcast',
          link: 'https://example.com',
          description: 'Test description',
          recipeAmount: 1,
        },
      }),
    ]);

    setupApp(await RecipesPage());

    expect(
      within(screen.getByRole('link', { name: /book chapter recipe/i })).getByText(
        'Test Source · Classic Cocktails',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /book recipe/i })).getByText('Test Source'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /youtube recipe/i })).getByText(
        'Test Channel',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /podcast recipe/i })).getByText(
        'Test Podcast',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recipe Author')).not.toBeInTheDocument();
    expect(screen.queryByText('Some Bar')).not.toBeInTheDocument();
  });

  it('typing in search filters the recipe list', async () => {
    const { user } = setupApp(await RecipesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');
    expect(resultList).not.toHaveTextContent('Margarita');
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    mockRouter.setCurrentUrl('?search=moj');
    const { user } = setupApp(await RecipesPage());

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
    const { user } = setupApp(await RecipesPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'dai');

    // Check that URL was updated with search param
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=dai' }),
    );
  });

  it('matches beyond the name through the shared search index', async () => {
    const bartenderRecipe = mockRecipe('Bartender Special', {
      attributions: [{ relation: 'recipe author', source: 'Jane Doe' }],
    });
    const recipes = [...testRecipes, bartenderRecipe];
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);
    vi.mocked(fetch).mockResolvedValue(
      Response.json(buildSearchIndex(toSearchIndexItems(recipes))),
    );

    mockRouter.setCurrentUrl('?search=jane%20doe');
    setupApp(await RecipesPage());

    // An active search loads the index right away; until then names stand in.
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Bartender Special');
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await RecipesPage());

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
    mockRouter.setCurrentUrl('?search=margarita');
    setupApp(await RecipesPage());

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');

    // Select the result list and check its text content
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('groups recipes by first letter when not searching', async () => {
    setupApp(await RecipesPage());

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

// The app's own URL adapter (not nuqs's testing adapter): it reads
// `location.search`, renders "no search" on the server, and follows Next
// router navigations through the patched History API.
describe('RecipesPage with the app URL adapter', () => {
  function withAppAdapter(ui: ReactNode) {
    return (
      <MemoryRouterProvider>
        <NuqsAdapter>{ui}</NuqsAdapter>
      </MemoryRouterProvider>
    );
  }

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('prerenders every recipe even when the URL has a search', async () => {
    window.history.replaceState(null, '', '/list/recipes?search=margarita');

    const html = renderToString(withAppAdapter(await RecipesPage()));

    for (const recipe of testRecipes) {
      expect(html).toContain(`href="${getRecipeUrl(recipe)}"`);
    }
  });

  it('applies ?search= when landing on the page', async () => {
    window.history.replaceState(null, '', '/list/recipes?search=margarita');

    render(withAppAdapter(await RecipesPage()));

    expect(screen.getByRole('searchbox')).toHaveValue('margarita');
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('follows router navigations and back/forward', async () => {
    window.history.replaceState(null, '', '/list/recipes');
    render(withAppAdapter(await RecipesPage()));
    expect(screen.getByRole('group', { name: 'M' })).toHaveTextContent('Mojito');

    // Next's router changes the URL through history.pushState.
    act(() => {
      window.history.pushState(null, '', '/list/recipes?search=daiquiri');
    });
    expect(screen.getByRole('searchbox')).toHaveValue('daiquiri');
    expect(screen.getByRole('list')).not.toHaveTextContent('Mojito');

    act(() => {
      window.history.replaceState(null, '', '/list/recipes');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('group', { name: 'M' })).toHaveTextContent('Mojito');
  });
});
