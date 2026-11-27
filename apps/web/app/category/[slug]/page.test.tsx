import type { Recipe } from '@cocktails/data';
import { getCategory, getChildCategories } from '@cocktails/data/categories';
import type * as CategoriesModule from '@cocktails/data/categories';
import { getIngredient, getIngredientsForCategory } from '@cocktails/data/ingredients';
import type * as IngredientsModule from '@cocktails/data/ingredients';
import { getRecipe, getRecipeByCategory } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { buildCategoryPages } from '#/modules/buildCategoryPages';
import { getCategoryUrl } from '#/modules/url';
import {
  failJson,
  hangJson,
  serveJson,
  sharedJsonServer,
} from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import CategoryPage from './page';

vi.mock('@cocktails/data/categories', async (importOriginal) => ({
  ...(await importOriginal<typeof CategoriesModule>()),
  getChildCategories: vi.fn(),
}));
vi.mock('@cocktails/data/ingredients', async (importOriginal) => ({
  ...(await importOriginal<typeof IngredientsModule>()),
  getIngredientsForCategory: vi.fn(),
}));
vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getRecipeByCategory: vi.fn(),
}));

const testMembers = [await getIngredient('spirit', 'beefeater-london-dry-gin')];
const testRecipes = await Promise.all([
  getRecipe({ type: 'book', slug: 'easy-tiki' }, 'fog-cutter', '01_Classic Recipes'),
  getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'cloister'),
]);
const { getChildCategories: getActualChildCategories } = await vi.importActual<
  typeof CategoriesModule
>('@cocktails/data/categories');
const { getIngredientsForCategory: getActualIngredientsForCategory } =
  await vi.importActual<typeof IngredientsModule>('@cocktails/data/ingredients');

/** The catalog as the category pages read it: testRecipes keyed for this page. */
const testCatalog = buildCatalog([
  {
    key: 'category/london-dry-gin',
    recipes: testRecipes,
    pickQuantity: (recipe) =>
      recipe.ingredients.find((ingredient) => {
        if (ingredient.type === 'category') {
          return ingredient.slug === 'london-dry-gin';
        }
        return ingredient.categories.some((c) => c.slug === 'london-dry-gin');
      })?.quantity,
  },
]);

/**
 * The category page at a category's URL: every category URL serves the
 * same page, which renders the entry of its own path out of the category
 * data file — built here by the real builder, against the data mocks the
 * test set up. The query a test set beforehand stays.
 */
async function pageAt(slug: string) {
  const pages = await buildCategoryPages([await getCategory(slug)]);
  sharedJsonServer.use(serveJson('/data/categories.json', pages));
  mockRouter.setCurrentUrl({
    pathname: getCategoryUrl({ slug }),
    query: mockRouter.query,
  });
  return <CategoryPage />;
}

beforeEach(() => {
  vi.mocked(getChildCategories).mockResolvedValue([]);
  vi.mocked(getIngredientsForCategory).mockResolvedValue(testMembers);
  vi.mocked(getRecipeByCategory).mockResolvedValue(testRecipes);
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('CategoryPage', () => {
  describe('member bottles', () => {
    // These tests need the real member lists (rum: 95 bottles), not the
    // file-wide single-member mock.
    beforeEach(() => {
      vi.mocked(getIngredientsForCategory).mockImplementation(
        getActualIngredientsForCategory,
      );
    });

    it('previews the most-used members, with a see-all row opening the drawer', async () => {
      // Rum's category page: 95 member bottles across its child categories —
      // too many for the page, so three preview rows show and the see-all
      // row opens the drawer holding the full list.
      const rumCategory = await getCategory('rum');
      const expectedMembers = await getActualIngredientsForCategory(rumCategory);

      await setupApp(await pageAt('rum'));

      const membersGroup = screen.getByRole('group', {
        name: 'Examples of Rum',
      });

      // The preview: the three most-used bottles, as plain links.
      expect(within(membersGroup).getAllByRole('link')).toHaveLength(3);

      // The see-all row names the full count.
      expect(
        within(membersGroup).getByRole('button', {
          name: `See all ${expectedMembers.length} bottles`,
        }),
      ).toBeInTheDocument();
    });

    it('keeps the full member list in the closed sheet, crawlable', async () => {
      // keepMounted: the drawer's content renders while closed, so every
      // bottle link ships in the static export's HTML.
      await setupApp(await pageAt('rum'));

      // The closed sheet is hidden, so its accessible name doesn't
      // compute — query by role and match the title text.
      const sheet = screen.getAllByRole('dialog', { hidden: true })[0]!;
      expect(sheet).toHaveTextContent('Rum bottles');

      const rumCategory = await getCategory('rum');
      const expectedMembers = await getActualIngredientsForCategory(rumCategory);
      expect(within(sheet).getAllByRole('link', { hidden: true })).toHaveLength(
        expectedMembers.length,
      );
    });
  });

  describe('basic rendering', () => {
    it('renders parent category chips under the title', async () => {
      await setupApp(await pageAt('london-dry-gin'));

      // London dry gin sits under Dry gin, as pills right under the title.
      const chipsGroup = screen.getByRole('group', { name: 'Parent categories' });
      const parentLink = within(chipsGroup).getByRole('link', { name: 'Dry gin' });
      expect(parentLink).toHaveAttribute('href', '/category/dry-gin');

      // The chips sit between the title and the rest of the page content.
      const title = screen.getByRole('heading', { level: 1, name: 'London dry gin' });
      expect(
        title.compareDocumentPosition(chipsGroup) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();

      // The parent link from the chips always goes to its category page.
      const dryGinLinks = screen.getAllByRole('link', { name: /^Dry gin/ });
      expect(dryGinLinks.length).toBeGreaterThan(0);
      for (const link of dryGinLinks) {
        expect(link).toHaveAttribute('href', '/category/dry-gin');
      }
    });

    it('renders example ingredients for the category', async () => {
      await setupApp(await pageAt('london-dry-gin'));

      // Should show examples of London dry gin
      expect(screen.getByText(/Examples of.*London dry gin/)).toBeInTheDocument();

      // Beefeater is a London dry gin; its 56 recipes lead the list, so the
      // count trails the name in the row's accessible name.
      expect(
        screen.getByRole('link', { name: /Beefeater London Dry Gin 56/ }),
      ).toBeInTheDocument();
    });

    it('orders the preview by recipe count and shows the count', async () => {
      // These tests need the real member lists, not the file-wide mock.
      vi.mocked(getIngredientsForCategory).mockImplementation(
        getActualIngredientsForCategory,
      );

      await setupApp(await pageAt('london-dry-gin'));

      const membersGroup = screen.getByRole('group', {
        name: /Examples of London dry gin/,
      });

      // Recipe counts in the London dry gin shelf: Beefeater (56) leads,
      // Tanqueray (26), Fords (13) — the three most-used bottles preview.
      const hrefs = within(membersGroup)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'));

      const order = (slug: string) =>
        hrefs.includes(`/cocktails/ingredient/spirit/${slug}`)
          ? hrefs.indexOf(`/cocktails/ingredient/spirit/${slug}`)
          : hrefs.indexOf(`/ingredient/spirit/${slug}`);
      expect(order('beefeater-london-dry-gin')).toBe(0);
      expect(order('tanqueray-london-dry-gin')).toBe(1);
      expect(order('fords-gin')).toBe(2);

      // Every preview row carries its recipe count next to the name.
      expect(membersGroup).toHaveTextContent('56');
      expect(membersGroup).toHaveTextContent('26');
      expect(membersGroup).toHaveTextContent('13');
    });

    it('keeps every member link in the closed sheet (SEO)', async () => {
      vi.mocked(getIngredientsForCategory).mockImplementation(
        getActualIngredientsForCategory,
      );

      await setupApp(await pageAt('london-dry-gin'));

      // keepMounted: the sheet renders while closed, so the static export
      // carries all 13 London dry gin bottle links, not only the preview.
      // The closed sheet is hidden, so its accessible name doesn't
      // compute — query by role.
      const sheet = screen.getAllByRole('dialog', { hidden: true })[0]!;
      expect(sheet).toHaveTextContent('London dry gin bottles');
      expect(within(sheet).getAllByRole('link', { hidden: true })).toHaveLength(13);
    });

    it('renders links to nested child categories', async () => {
      const childCategories = await Promise.all([
        getCategory('aged-rum'),
        getCategory('blended-aged-rum-jamaica'),
        getCategory('aged-cachaca'),
      ]);
      vi.mocked(getChildCategories).mockImplementation(getActualChildCategories);

      await setupApp(await pageAt('rum'));

      expect(screen.getByText('Subcategories of Rum')).toBeInTheDocument();
      for (const childCategory of childCategories) {
        expect(screen.getByRole('link', { name: childCategory.name })).toHaveAttribute(
          'href',
          getCategoryUrl(childCategory),
        );
      }
    });

    it('renders search header with title', async () => {
      await setupApp(await pageAt('london-dry-gin'));

      expect(
        screen.getByRole('heading', { level: 1, name: 'London dry gin' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('recipe list', () => {
    it('renders recipes using the category with header', async () => {
      await setupApp(await pageAt('london-dry-gin'));

      // setupApp flushes the catalog load: the rows and header are already there.
      expect(screen.getByText('Recipes using London dry gin')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Fog Cutter/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Cloister/ })).toHaveTextContent(
        'Anders Erickson',
      );
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      await setupApp(await pageAt('london-dry-gin'));

      // Fog Cutter uses 0.5 oz London dry gin (category type)
      const fogCutterLink = screen.getByRole('link', { name: /Fog Cutter/ });
      expect(fogCutterLink).toHaveTextContent('½ oz');

      // Cloister uses 1.5 oz Beefeater London Dry Gin (spirit in category)
      const cloisterLink = screen.getByRole('link', { name: /Cloister/ });
      expect(cloisterLink).toHaveTextContent('1 ½ oz');
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within category', async () => {
      const { user } = await setupApp(await pageAt('london-dry-gin'));

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = await setupApp(await pageAt('london-dry-gin'), {
        nuqsOptions: { onUrlUpdate },
      });

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=fog' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = await setupApp(await pageAt('london-dry-gin'));

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides category description when searching', async () => {
      const { user } = await setupApp(await pageAt('london-dry-gin'));

      // Parent category chips should be visible initially
      expect(
        screen.getByRole('group', { name: 'Parent categories' }),
      ).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Parent category chips should be hidden during search
      expect(
        screen.queryByRole('group', { name: 'Parent categories' }),
      ).not.toBeInTheDocument();
    });

    it('hides ingredient members list when searching', async () => {
      const { user } = await setupApp(await pageAt('london-dry-gin'));

      // Members list is visible initially
      expect(screen.getByText(/Examples of.*London dry gin/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Members list should be hidden during search
      expect(screen.queryByText(/Examples of.*London dry gin/)).not.toBeInTheDocument();
    });

    it('loads with search term from URL', async () => {
      mockRouter.setCurrentUrl('?search=fog');
      await setupApp(await pageAt('london-dry-gin'));

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('fog');

      // With a search active, setupApp still flushes the catalog load.
      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('clearing search shows all content', async () => {
      mockRouter.setCurrentUrl('?search=fog');
      const { user } = await setupApp(await pageAt('london-dry-gin'));

      // Initially filtered - examples should be hidden
      expect(screen.queryByText(/Examples of.*London dry gin/)).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // All content should be visible again
      expect(
        screen.getByRole('group', { name: 'Parent categories' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Examples of.*London dry gin/)).toBeInTheDocument();

      // Recipes should be grouped alphabetically
      expect(screen.getByRole('link', { name: /Fog Cutter/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Cloister/ })).toBeInTheDocument();
    });
  });

  describe('catalog-driven recipe list', () => {
    const catalogRecipe = (name: string): Recipe => ({
      ...testRecipes[0],
      name,
      slug: name.toLowerCase().replaceAll(' ', '-'),
    });

    /** Two recipes from the catalog: enough for loading, loaded and failed. */
    const catalogRecipes = [catalogRecipe('Zebra Tail'), catalogRecipe('Alpha Yeti')];

    const catalog = buildCatalog([
      {
        key: 'category/london-dry-gin',
        recipes: catalogRecipes,
        pickQuantity: () => undefined,
      },
    ]);

    /**
     * The recipe rows' list group, however many other lists the page shows.
     * Its aria-labelledby id has spaces, which breaks the accessible name, so
     * walk up from the subheader text instead.
     */
    function getRecipeList(): HTMLElement {
      const subheader = screen.getByText('Recipes using London dry gin');
      const list = subheader.closest('[role="group"]');
      if (!(list instanceof HTMLElement)) {
        throw new Error('recipe list group not found');
      }
      return list;
    }

    beforeEach(() => {
      vi.mocked(getRecipeByCategory).mockResolvedValue(catalogRecipes);
    });

    it('shows the loading state before the catalog lands', async () => {
      sharedJsonServer.use(hangJson('/data/catalog.json'));

      await setupApp(await pageAt('london-dry-gin'));

      // The reserved space is there at once; the skeleton rows wait out
      // their grace period.
      expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
      expect(screen.queryByText('Alpha Yeti')).not.toBeInTheDocument();
    });

    it('renders the full list from the catalog once loaded', async () => {
      sharedJsonServer.use(serveJson('/data/catalog.json', catalog));

      await setupApp(await pageAt('london-dry-gin'));

      const list = getRecipeList();
      expect(list).toHaveTextContent('Zebra Tail');
      expect(list).toHaveTextContent('Alpha Yeti');
    });

    it('shows the loading state while searching, not a false no-results', async () => {
      sharedJsonServer.use(hangJson('/data/catalog.json'));
      mockRouter.setCurrentUrl('?search=zebra');

      await setupApp(await pageAt('london-dry-gin'));

      // While the catalog loads, a search shows the loading state — the
      // full list it must match is not there yet — never "No results found".
      expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('offers a reload when a search outlives a failed catalog fetch', async () => {
      sharedJsonServer.use(failJson('/data/catalog.json', 500));
      mockRouter.setCurrentUrl('?search=zebra');

      await setupApp(await pageAt('london-dry-gin'));

      // The reload affordance lives in the search branch too. setupApp's
      // flush settles the rejected load, so the failure state is already up.
      expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
    });

    it('offers a reload when the catalog fails to load', async () => {
      sharedJsonServer.use(failJson('/data/catalog.json', 500));

      await setupApp(await pageAt('london-dry-gin'));

      expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Alpha Yeti')).not.toBeInTheDocument();
    });
  });
});
