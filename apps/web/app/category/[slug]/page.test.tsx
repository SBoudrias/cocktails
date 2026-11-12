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

/** Serve the test catalog from the fetch the pages issue. */

beforeEach(() => {
  vi.mocked(getChildCategories).mockResolvedValue([]);
  vi.mocked(getIngredientsForCategory).mockResolvedValue(testMembers);
  vi.mocked(getRecipeByCategory).mockResolvedValue(testRecipes);
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('CategoryPage', () => {
  describe('substitution lists', () => {
    // These tests need the real member lists (rum: 98 bottles), not the
    // file-wide single-member mock.
    beforeEach(() => {
      vi.mocked(getIngredientsForCategory).mockImplementation(
        getActualIngredientsForCategory,
      );
    });

    it('caps the members list at 15 links with a see-all link last when capped', async () => {
      // Rum's category page: 98 member bottles across its child categories.
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'rum' }),
        }),
      );

      const membersGroup = screen.getByRole('group', {
        name: 'Examples of Rum',
      });

      const links = within(membersGroup).getAllByRole('link');
      expect(links).toHaveLength(15);

      // The see-all link closes the list and points at the category's full
      // bottles route.
      const seeAllLink = within(membersGroup).getByRole('link', {
        name: /see all/i,
      });
      expect(seeAllLink).toHaveAttribute('href', '/category/rum/bottles');
      expect(seeAllLink).toBe(links.at(-1));
    });

    it('renders no see-all link when the category fits under the cap', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const membersGroup = screen.getByRole('group', {
        name: 'Examples of London dry gin',
      });

      expect(
        within(membersGroup).queryByRole('link', { name: /see all/i }),
      ).not.toBeInTheDocument();
    });

    it('lists related categories, not bottles, as secondary substitutions', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'blended-aged-rum-jamaica' }),
        }),
      );

      const relatedGroup = screen.getByRole('group', {
        name: 'Substitution-friendly categories',
      });

      // Blended aged rum (Jamaica) sits under two parents: Blended aged rum
      // and Jamaican rum — so its neighbors are those parents and their other
      // children, the other aged-rum and Jamaican-rum cuts.
      for (const name of [
        'Blended aged rum',
        'Jamaican rum',
        'Blended aged rum (Barbados)',
        'Blended lightly-aged rum (Jamaica)',
        'Navy strength Jamaican rum',
      ]) {
        expect(within(relatedGroup).getByRole('link', { name })).toBeInTheDocument();
      }

      // Category links, not bottle rows.
      expect(relatedGroup).not.toHaveTextContent(/appleton|hampden|worthy park/i);
    });

    it('renders no substitution lists for a category without members or neighbors', async () => {
      // Coffee bitters is an empty leaf category: no bottles of its own, no
      // children, no parents — nothing to list.
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'coffee-bitters' }),
        }),
      );

      expect(
        screen.queryByRole('group', { name: /Examples of Falernum/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('group', { name: 'Substitution-friendly categories' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('renders parent category information', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // London dry gin is a subset of Dry Gin
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();

      // The parent links from both the subset card and the related-categories
      // list, always to its category page.
      const dryGinLinks = screen.getAllByRole('link', { name: /^Dry gin/ });
      expect(dryGinLinks.length).toBeGreaterThan(0);
      for (const link of dryGinLinks) {
        expect(link).toHaveAttribute('href', '/category/dry-gin');
      }
    });

    it('renders example ingredients for the category', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Should show examples of London dry gin
      expect(screen.getByText(/Examples of.*London dry gin/)).toBeInTheDocument();

      // Beefeater is a London dry gin
      expect(
        screen.getByRole('link', { name: 'Beefeater London Dry Gin' }),
      ).toBeInTheDocument();
    });

    it('renders links to nested child categories', async () => {
      const childCategories = await Promise.all([
        getCategory('aged-rum'),
        getCategory('blended-aged-rum-jamaica'),
        getCategory('aged-cachaca'),
      ]);
      vi.mocked(getChildCategories).mockImplementation(getActualChildCategories);

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'rum' }),
        }),
      );

      expect(screen.getByText('Subcategories of Rum')).toBeInTheDocument();
      for (const childCategory of childCategories) {
        expect(screen.getByRole('link', { name: childCategory.name })).toHaveAttribute(
          'href',
          getCategoryUrl(childCategory),
        );
      }
    });

    it('renders search header with title', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'London dry gin' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('recipe list', () => {
    it('renders recipes using the category with header', async () => {
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

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
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

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
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=fog' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides category description when searching', async () => {
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Parent categories should be visible initially
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Parent categories should be hidden during search
      expect(screen.queryByText(/is a subset of/)).not.toBeInTheDocument();
    });

    it('hides ingredient members list when searching', async () => {
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Members list is visible initially
      expect(screen.getByText(/Examples of.*London dry gin/)).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'fog');

      // Members list should be hidden during search
      expect(screen.queryByText(/Examples of.*London dry gin/)).not.toBeInTheDocument();
    });

    it('loads with search term from URL', async () => {
      mockRouter.setCurrentUrl('?search=fog');
      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('fog');

      // With a search active, setupApp still flushes the catalog load.
      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Fog Cutter');
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('clearing search shows all content', async () => {
      mockRouter.setCurrentUrl('?search=fog');
      const { user } = await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Initially filtered - examples should be hidden
      expect(screen.queryByText(/Examples of.*London dry gin/)).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // All content should be visible again
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();
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

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // The reserved space is there at once; the skeleton rows wait out
      // their grace period.
      expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
      expect(screen.queryByText('Alpha Yeti')).not.toBeInTheDocument();
    });

    it('renders the full list from the catalog once loaded', async () => {
      sharedJsonServer.use(serveJson('/data/catalog.json', catalog));

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const list = getRecipeList();
      expect(list).toHaveTextContent('Zebra Tail');
      expect(list).toHaveTextContent('Alpha Yeti');
    });

    it('shows the loading state while searching, not a false no-results', async () => {
      sharedJsonServer.use(hangJson('/data/catalog.json'));
      mockRouter.setCurrentUrl('?search=zebra');

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // While the catalog loads, a search shows the loading state — the
      // full list it must match is not there yet — never "No results found".
      expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('offers a reload when a search outlives a failed catalog fetch', async () => {
      sharedJsonServer.use(failJson('/data/catalog.json', 500));
      mockRouter.setCurrentUrl('?search=zebra');

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // The reload affordance lives in the search branch too. setupApp's
      // flush settles the rejected load, so the failure state is already up.
      expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
    });

    it('offers a reload when the catalog fails to load', async () => {
      sharedJsonServer.use(failJson('/data/catalog.json', 500));

      await setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Alpha Yeti')).not.toBeInTheDocument();
    });
  });
});
