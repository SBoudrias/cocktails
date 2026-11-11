import { getRecipe, getRecipesByAuthor } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import {
  failJson,
  hangJson,
  serveJson,
  sharedJsonServer,
} from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import AuthorRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getRecipesByAuthor: vi.fn(),
}));

// Real recipes: the list rows render their name and source label, so the
// fixtures double as the content the assertions below look for.
const [byTheToe, theDeathStar, bikiniKill] = await Promise.all([
  getRecipe(
    { type: 'book', slug: 'minimalist-tiki' },
    'by-the-toe',
    '04_Minimalist Tiki Classic Thirty... Modern Take',
  ),
  getRecipe(
    { type: 'book', slug: 'minimalist-tiki' },
    'the-death-star',
    '04_Minimalist Tiki Classic Thirty... Modern Take',
  ),
  getRecipe(
    { type: 'book', slug: 'death-co-welcome-home' },
    'bikini-kill',
    '05_Elegant & Graceful (Martini)',
  ),
]);

/** The recipes the tested authors' pages list, keyed by author slug. */
const authorRecipes: Record<string, (typeof byTheToe)[]> = {
  'brian-maxwell': [byTheToe, theDeathStar],
  'aj-stocak': [bikiniKill],
  // The About-card authors below assert no rows; any recipe keeps their
  // page past the notFound() guard.
  'anders-erickson': [bikiniKill],
  'sam-ross': [bikiniKill],
  'garret-richard': [bikiniKill],
};

/** The catalog as the author pages read it: the tested authors' lists. */
const testCatalog = buildCatalog(
  Object.entries(authorRecipes).map(([slug, recipes]) => ({
    key: `list/authors/${slug}`,
    recipes,
    pickQuantity: () => undefined,
  })),
);

beforeEach(() => {
  mockRouter.setCurrentUrl('/');
  vi.mocked(getRecipesByAuthor).mockImplementation(
    async (author) => authorRecipes[author.slug] ?? [],
  );
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('AuthorRecipesPage', () => {
  it('renders the About card with link and description for a verified author', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // The About card's header is the page's title — the name shows once.
    expect(screen.getAllByText('Brian Maxwell')).toHaveLength(1);
    // The recipe list carries the author's name, without duplication of the card's content.
    expect(screen.getByText('Recipes by Brian Maxwell')).toBeInTheDocument();
    expect(screen.getByText('Tiki blogger behind Shaker of Spirits')).toBeInTheDocument();

    const websiteLink = screen.getByRole('link', { name: /shakerofspirits\.com/i });
    expect(websiteLink).toHaveAttribute('href', 'https://shakerofspirits.com');
  });

  it('renders the card header for a name-only author, without extra links', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'aj-stocak' }),
      }),
    );

    expect(screen.getAllByText('AJ Stocak')).toHaveLength(1);
    // Name-only entities have no external links on their page.
    expect(screen.queryByRole('link', { name: /\.com/i })).not.toBeInTheDocument();
  });

  it("links the author's known-for bars and the sources behind them", async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'anders-erickson' }),
      }),
    );

    const channelLink = screen.getByRole('link', { name: 'Anders Erickson' });
    expect(channelLink).toHaveAttribute(
      'href',
      '/source/youtube-channel/anders-erickson',
    );

    // The bars/sources lines interleave text and links, so match on the
    // typography element that carries exactly the full line.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element?.textContent === 'Behind Anders Erickson',
      ),
    ).toBeInTheDocument();
  });

  it('renders social links as brand icons with @handle labels', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'sam-ross' }),
      }),
    );

    // Social links show the brand mark plus the handle from the url path;
    // the accessible name carries the full url.
    const instagramLink = screen.getByRole('link', {
      name: 'https://www.instagram.com/samueljoelross',
    });
    expect(instagramLink).toHaveTextContent('samueljoelross');

    const xLink = screen.getByRole('link', { name: 'https://x.com/samueljoelross' });
    expect(xLink).toHaveTextContent('samueljoelross');
  });

  it('renders website links as globe icon with domain label', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'garret-richard' }),
      }),
    );

    // Website links show a globe and the bare domain — no https:// prefix,
    // no outside-arrow icon.
    const websiteLink = screen.getByRole('link', {
      name: 'https://www.tropicalstandard.com/',
    });
    expect(websiteLink).toHaveTextContent('tropicalstandard.com');
  });
});

describe('AuthorRecipesPage catalog-driven recipe list', () => {
  /**
   * The recipe rows' list group, however many other lists the page shows.
   * Its aria-labelledby id has spaces, which breaks the accessible name, so
   * walk up from the subheader text instead.
   */
  function getRecipeList(): HTMLElement {
    const subheader = screen.getByText('Recipes by Brian Maxwell');
    const list = subheader.closest('[role="group"]');
    if (!(list instanceof HTMLElement)) {
      throw new Error('recipe list group not found');
    }
    return list;
  }

  it('shows the loading state before the catalog lands', async () => {
    sharedJsonServer.use(hangJson('/data/catalog.json'));

    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // The reserved space is there at once; the skeleton rows wait out
    // their grace period.
    expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
    expect(screen.queryByText('By the Toe')).not.toBeInTheDocument();
  });

  it('renders the full list from the catalog once loaded', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // setupApp flushes the catalog load: the rows and header are already there.
    const list = getRecipeList();
    expect(list).toHaveTextContent('By the Toe');
    expect(list).toHaveTextContent('The Death Star');
  });

  it('search filters the recipes within the author', async () => {
    const { user } = await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'toe');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent('By the Toe');
    expect(resultList).not.toHaveTextContent('The Death Star');
  });

  it('shows the loading state while searching, not a false no-results', async () => {
    sharedJsonServer.use(hangJson('/data/catalog.json'));
    mockRouter.setCurrentUrl('?search=toe');

    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // While the catalog loads, a search shows the loading state — the
    // full list it must match is not there yet — never "No results found".
    expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('offers a reload when the catalog fails to load', async () => {
    sharedJsonServer.use(failJson('/data/catalog.json', 500));

    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload the page/i })).toBeInTheDocument();
    expect(screen.queryByText('By the Toe')).not.toBeInTheDocument();
  });
});
