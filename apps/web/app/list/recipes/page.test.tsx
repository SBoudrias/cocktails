import type { Recipe } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { vi, beforeEach, describe, it } from 'vitest';
// The app's client setup: enables nuqs history sync, as in the browser.
import '#/instrumentation-client';
import { buildSearchIndex, toSearchIndexItems } from '#/modules/buildSearchIndex';
import { getRecipeUrl } from '#/modules/url';
import { serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp, withVirtuosoViewport } from '#/vitest.setup';
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
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
});

/** 300 "A" recipes (the prerendered rows) and one "Z" recipe past them. */
function mockLongList() {
  const firstApple = mockRecipe('Apple 1');
  const moreApples = Array.from({ length: 299 }, (_, index) =>
    mockRecipe(`Apple ${index + 2}`),
  );
  const zombie = mockRecipe('Zombie');
  return { firstApple, zombie, recipes: [firstApple, ...moreApples, zombie] };
}

/**
 * The A–Z list as read top to bottom: each letter heading, then its recipe
 * names. The virtualized list lays its headings and rows out flat.
 */
function getListOutline(): string[] {
  const list = screen.getByRole('list');
  return [...within(list).getAllByRole('heading'), ...within(list).getAllByRole('link')]
    .toSorted((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    .map((element) =>
      element.tagName === 'A'
        ? `  ${within(element).getAllByText(/.+/)[0]?.textContent}`
        : `${element.textContent}`,
    );
}

describe('RecipesPage', () => {
  it('renders search input and recipe list', async () => {
    await setupApp(await RecipesPage());

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveTextContent('Mojito');
    expect(screen.getByRole('list')).toHaveTextContent('Daiquiri');
    expect(screen.getAllByText('Test Source')).toHaveLength(testRecipes.length);
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

    await setupApp(await RecipesPage());

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
    const { user } = await setupApp(await RecipesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'moj');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');
    expect(resultList).not.toHaveTextContent('Margarita');
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    mockRouter.setCurrentUrl('?search=moj');
    const { user } = await setupApp(await RecipesPage());

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Mojito');
    expect(resultList).not.toHaveTextContent('Daiquiri');

    // Clear the search
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // All recipes should be visible, grouped by letter
    expect(getListOutline()).toMatchInlineSnapshot(`
      [
        "D",
        "  Daiquiri",
        "L",
        "  The Last Word",
        "M",
        "  Mai Tai",
        "  Margarita",
        "  Mojito",
      ]
    `);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = await setupApp(await RecipesPage(), {
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
    sharedJsonServer.use(
      serveJson('/data/search-index.json', buildSearchIndex(toSearchIndexItems(recipes))),
    );

    let served = 0;
    sharedJsonServer.events.on('request:start', () => {
      served += 1;
    });

    mockRouter.setCurrentUrl('?search=jane%20doe');
    await setupApp(await RecipesPage());

    // An active search loads the index right away; until then names stand in.
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Bartender Special');
    });
    expect(served).toBe(1);
  });

  it('shows no results when search has no matches', async () => {
    const { user } = await setupApp(await RecipesPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No recipes or ingredients matched/)).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', async () => {
    const mojito = mockRecipe('Test Recipe');
    vi.mocked(getAllRecipes).mockResolvedValue([mojito]);
    await setupApp(await RecipesPage());

    const link = screen.getByRole('link', { name: /test recipe/i });
    expect(link).toHaveAttribute('href', getRecipeUrl(mojito));
  });

  it('loads with search term from URL', async () => {
    mockRouter.setCurrentUrl('?search=margarita');
    await setupApp(await RecipesPage());

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('margarita');

    // Select the result list and check its text content
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('Margarita');
    expect(resultList).not.toHaveTextContent('Mojito');
  });

  it('groups recipes by first letter when not searching', async () => {
    await setupApp(await RecipesPage());

    // Leading articles are skipped: "The Last Word" files under L.
    expect(getListOutline()).toMatchInlineSnapshot(`
      [
        "D",
        "  Daiquiri",
        "L",
        "  The Last Word",
        "M",
        "  Mai Tai",
        "  Margarita",
        "  Mojito",
      ]
    `);
  });

  it('lists recipes beyond the prerendered letters from the search index', async () => {
    const { zombie, recipes } = mockLongList();
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);
    sharedJsonServer.use(
      serveJson('/data/search-index.json', buildSearchIndex(toSearchIndexItems(recipes))),
    );

    await setupApp(await RecipesPage());
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /zombie/i })).toHaveAttribute(
        'href',
        getRecipeUrl(zombie),
      );
    });
    // One fetch of the index covers the whole list.
    expect(sharedJsonServer.listHandlers()).toHaveLength(1);
  });
});

// The app's own URL adapter (not nuqs's testing adapter): it reads
// `location.search`, renders "no search" on the server, and follows Next
// router navigations through the patched History API. setupApp mounts nuqs's
// testing adapter, which fakes exactly that, so these tests mount the real one.
describe('RecipesPage with the app URL adapter', () => {
  function withAppAdapter(ui: ReactNode) {
    return (
      <MemoryRouterProvider>
        <NuqsAdapter>{withVirtuosoViewport(ui)}</NuqsAdapter>
      </MemoryRouterProvider>
    );
  }

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('prerenders the first letters only; the rest waits for the index', async () => {
    const { firstApple, zombie, recipes } = mockLongList();
    vi.mocked(getAllRecipes).mockResolvedValue(recipes);

    // The static HTML stops after the letters filling the first 300 rows.
    const html = renderToString(withAppAdapter(await RecipesPage()));
    expect(html).toContain(`href="${getRecipeUrl(firstApple)}"`);
    expect(html).not.toContain(`href="${getRecipeUrl(zombie)}"`);
  });

  it('prerenders the list even when the URL has a search', async () => {
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
    expect(screen.getByRole('list')).toHaveTextContent('Mojito');

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
    expect(screen.getByRole('list')).toHaveTextContent('Mojito');
  });
});
