import { getAuthor } from '@cocktails/data/authors';
import { getRecipe, getRecipesByAuthor } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCatalog, getAuthorSourcePicker } from '#/modules/buildCatalog';
import { hangJson, serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import AuthorRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getRecipesByAuthor: vi.fn(),
}));

// Real recipes: the list rows render their name and secondary line, so the
// fixtures double as the content the assertions below look for. Derek
// Cole's channel carries his originals and his adaptations — the origin
// named by its creator (Uahi Uahi) or by a book (Pineapple Milk).
const [byTheToe, theDeathStar, bikiniKill, boatDays, uahiUahi, pineappleMilk] =
  await Promise.all([
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
    getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'boat-days'),
    getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'uahi-uahi'),
    getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'pineapple-milk'),
  ]);

/** The recipes the tested authors' pages list, keyed by author slug. */
const authorRecipes: Record<string, (typeof byTheToe)[]> = {
  'brian-maxwell': [byTheToe, theDeathStar],
  'aj-stocak': [bikiniKill],
  'derek-cole': [boatDays, uahiUahi, pineappleMilk],
  // The About-card authors below assert no rows; any recipe keeps their
  // page past the notFound() guard.
  'sam-ross': [bikiniKill],
  'garret-richard': [bikiniKill],
  'alex-day': [bikiniKill],
};

/** The catalog as the author pages read it: the tested authors' lists, their
 * rows carrying the secondary line the author pages render. */
const authorSourcePickers = await Promise.all(
  Object.keys(authorRecipes).map(async (slug) => {
    const author = await getAuthor(slug);
    if (!author) throw new Error(`test fixture author missing: ${slug}`);
    return getAuthorSourcePicker(author);
  }),
);
const testCatalog = buildCatalog(
  Object.entries(authorRecipes).map(([slug, recipes], index) => ({
    key: `list/authors/${slug}`,
    recipes,
    pickQuantity: () => undefined,
    pickSource: authorSourcePickers[index],
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
        params: Promise.resolve({ name: 'derek-cole' }),
      }),
    );

    const channelLink = screen.getByRole('link', { name: 'Make and Drink' });
    expect(channelLink).toHaveAttribute('href', '/source/youtube-channel/make-and-drink');

    // The bars/sources lines interleave text and links, so match on the
    // typography element that carries exactly the full line.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element?.textContent === 'Behind Make and Drink',
      ),
    ).toBeInTheDocument();
  });

  it("navigates in-app to the author's bar page from the About card", async () => {
    const { user } = await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'alex-day' }),
      }),
    );

    // The bar link must resolve to the real /list/bars/[name] route — the
    // slug Death & Co's entity file carries — and be an in-app Link: a
    // plain anchor skips the router and the site's basePath, which 404s
    // on GitHub Pages.
    const barLink = screen.getByRole('link', { name: 'Death & Co' });
    expect(barLink).toHaveAttribute('href', '/list/bars/death-and-co-new-york-ny');

    await user.click(barLink);
    expect(mockRouter.asPath).toBe('/list/bars/death-and-co-new-york-ny');
  });

  it("navigates in-app to the author's source page from the About card", async () => {
    const { user } = await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'derek-cole' }),
      }),
    );

    // Same contract as the bar link: an in-app Link, not a plain anchor.
    await user.click(screen.getByRole('link', { name: 'Make and Drink' }));
    expect(mockRouter.asPath).toBe('/source/youtube-channel/make-and-drink');
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

  it('lets the action links wrap when they run wider than the card', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'garret-richard' }),
      }),
    );

    // The action buttons never shrink (whitespace-nowrap), and on a phone
    // their labels run wider than the card — Garret Richard's two links
    // were 384px natural against ~342px of card at 390px. The row wraps
    // instead of spilling past the plate.
    const websiteLink = screen.getByRole('link', {
      name: 'https://www.tropicalstandard.com/',
    });
    const actionsRow = websiteLink.closest('[data-slot="card-actions"]');
    expect(actionsRow).toHaveClass('flex-wrap');
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

  // The catalog list's other states — loading while a search is active, the
  // reload affordance after a failed fetch — are shared SearchableRecipePage
  // behavior, covered once on the category page.
});

describe('AuthorRecipesPage secondary line', () => {
  /** The row list of the given author's page, walked up from its subheader
   * (the header id contains spaces, which break the accessible name). */
  function getAuthorList(authorName: string): HTMLElement {
    const subheader = screen.getByText(`Recipes by ${authorName}`);
    const list = subheader.closest('[role="group"]');
    if (!(list instanceof HTMLElement)) {
      throw new Error('recipe list group not found');
    }
    return list;
  }

  it('leads an original in another book with the relationship, then the source', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // Brian Maxwell's originals live in Minimalist Tiki, a book he is not
    // behind, so his rows name it after the relationship.
    const list = getAuthorList('Brian Maxwell');
    expect(list).toHaveTextContent('Original · Minimalist Tiki');
  });

  it('keeps an original on the author own channel to the relationship alone', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'derek-cole' }),
      }),
    );

    // Boat Days is Derek's original on his own channel — the page
    // already implies the channel, so no source follows the relationship.
    const list = getAuthorList('Derek Cole');
    expect(list).toHaveTextContent('Boat Days');
    expect(list).not.toHaveTextContent('Original · Make and Drink');
    expect(list).toHaveTextContent('Original');
  });

  it('names the origin of an adaptation — its creator or its documenting book', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'derek-cole' }),
      }),
    );

    // Two adaptations on Derek's page: the Uahi Uahi names its original
    // creator, the Pineapple Milk the book it was documented in.
    const list = getAuthorList('Derek Cole');
    expect(list).toHaveTextContent('Adaptation · Don the Beachcomber');
    expect(list).toHaveTextContent("Adaptation · The Gentleman's Companion");
  });

  it('renders every secondary line as the relationship, not the raw source', async () => {
    await setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'derek-cole' }),
      }),
    );

    // Every row's text is its name then a relationship-led secondary line —
    // never the raw source ('Make and Drink') the list used to show.
    const recipeRows = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/recipes/'));
    expect(recipeRows).toHaveLength([boatDays, uahiUahi, pineappleMilk].length);

    for (const row of recipeRows) {
      expect(row.textContent).toMatch(/(Original|Adaptation)( · .+)?$/);
      expect(row.textContent).not.toContain('Make and Drink');
    }
  });
});
