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
import RecipesLetterPage, { generateStaticParams } from './page';

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

const mojito = mockRecipe('Mojito');
const margarita = mockRecipe('Margarita');
const maiTai = mockRecipe('Mai Tai');
const daiquiri = mockRecipe('Daiquiri');
const lastWord = mockRecipe('The Last Word');
const twentiethCentury = mockRecipe('20th Century');
const testRecipes = [mojito, margarita, maiTai, daiquiri, lastWord, twentiethCentury];

function letterPage(letter: string) {
  return RecipesLetterPage({ params: Promise.resolve({ letter }) });
}

beforeEach(() => {
  resetSearchIndexCache();
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
  vi.mocked(fetch).mockResolvedValue(
    Response.json(buildSearchIndex(toSearchIndexItems(testRecipes))),
  );
});

describe('RecipesLetterPage', () => {
  it('generates one page per first letter', async () => {
    expect(await generateStaticParams()).toEqual([
      { letter: '0-9' },
      { letter: 'd' },
      { letter: 'l' },
      { letter: 'm' },
    ]);
  });

  it("lists only the letter's recipes", async () => {
    setupApp(await letterPage('m'));

    expect(
      screen.getByRole('heading', { name: 'Recipes starting with M' }),
    ).toBeInTheDocument();
    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
    expect(screen.queryByRole('link', { name: /daiquiri/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mojito/i })).toHaveAttribute(
      'href',
      getRecipeUrl(mojito),
    );
  });

  it('skips leading articles and groups numbers under #', async () => {
    setupApp(await letterPage('l'));
    expect(screen.getByRole('group', { name: 'L' })).toHaveTextContent('The Last Word');

    setupApp(await letterPage('0-9'));
    expect(
      screen.getByRole('heading', { name: 'Recipes starting with a number' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '#' })).toHaveTextContent('20th Century');
  });

  it('links every letter page, marking the current one', async () => {
    setupApp(await letterPage('m'));

    const nav = screen.getByRole('navigation', { name: 'Recipes by letter' });
    expect(within(nav).getByRole('link', { name: 'M' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'D' })).toHaveAttribute(
      'href',
      getRecipeLetterUrl('d'),
    );
    expect(within(nav).getByRole('link', { name: 'D' })).not.toHaveAttribute(
      'aria-current',
    );
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
      mockRecipe('Basic YouTube Recipe', {
        source: {
          type: 'youtube-channel',
          name: 'Test Channel',
          slug: 'test-channel',
          links: ['https://example.com'],
          description: 'Test description',
          recipeAmount: 1,
        },
      }),
    ]);

    setupApp(await letterPage('b'));

    expect(
      within(screen.getByRole('link', { name: /book chapter recipe/i })).getByText(
        'Test Source · Classic Cocktails',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /^book recipe/i })).getByText(
        'Test Source',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /youtube recipe/i })).getByText(
        'Test Channel',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recipe Author')).not.toBeInTheDocument();
    expect(screen.queryByText('Some Bar')).not.toBeInTheDocument();
  });

  it('searches every recipe, not only the letter', async () => {
    mockRouter.setCurrentUrl('?search=daiquiri');
    setupApp(await letterPage('m'));

    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Daiquiri');
    });
    expect(screen.getByRole('list')).not.toHaveTextContent('Mojito');
    expect(
      screen.queryByRole('navigation', { name: 'Recipes by letter' }),
    ).not.toBeInTheDocument();
  });
});

// The app's own URL adapter (not nuqs's testing adapter): it reads
// `location.search`, renders "no search" on the server, and follows Next
// router navigations through the patched History API.
describe('RecipesLetterPage with the app URL adapter', () => {
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

  it('prerenders every recipe of the letter even when the URL has a search', async () => {
    window.history.replaceState(null, '', '/list/recipes/m?search=daiquiri');

    const html = renderToString(withAppAdapter(await letterPage('m')));

    for (const recipe of [mojito, margarita, maiTai]) {
      expect(html).toContain(`href="${getRecipeUrl(recipe)}"`);
    }
    expect(html).not.toContain(`href="${getRecipeUrl(daiquiri)}"`);
  });

  it('applies ?search= when landing on the page', async () => {
    window.history.replaceState(null, '', '/list/recipes/m?search=daiquiri');

    render(withAppAdapter(await letterPage('m')));

    expect(screen.getByRole('searchbox')).toHaveValue('daiquiri');
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Daiquiri');
    });
  });

  it('follows router navigations and back/forward', async () => {
    window.history.replaceState(null, '', '/list/recipes/m');
    render(withAppAdapter(await letterPage('m')));
    expect(screen.getByRole('group', { name: 'M' })).toHaveTextContent('Mojito');

    // Next's router changes the URL through history.pushState.
    act(() => {
      window.history.pushState(null, '', '/list/recipes/m?search=daiquiri');
    });
    expect(screen.getByRole('searchbox')).toHaveValue('daiquiri');
    await waitFor(() => {
      expect(screen.getByRole('list')).toHaveTextContent('Daiquiri');
    });

    act(() => {
      window.history.replaceState(null, '', '/list/recipes/m');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('group', { name: 'M' })).toHaveTextContent('Mojito');
  });
});
