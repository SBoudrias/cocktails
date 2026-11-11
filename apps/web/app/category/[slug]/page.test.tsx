import type { Recipe } from '@cocktails/data';
import { getCategory, getChildCategories } from '@cocktails/data/categories';
import type * as CategoriesModule from '@cocktails/data/categories';
import { getIngredient, getIngredientsForCategory } from '@cocktails/data/ingredients';
import type * as IngredientsModule from '@cocktails/data/ingredients';
import { getRecipe, getRecipeByCategory } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { resetCatalogCache } from '#/modules/catalog';
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
/** Serve the test catalog from the route the pages fetch. */
function serveCatalog() {
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
}

beforeAll(() => sharedJsonServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => sharedJsonServer.close());

beforeEach(() => {
  vi.mocked(getChildCategories).mockResolvedValue([]);
  vi.mocked(getIngredientsForCategory).mockResolvedValue([testMembers, []]);
  vi.mocked(getRecipeByCategory).mockResolvedValue(testRecipes);
  resetCatalogCache();
  // vitest.setup.ts rejects all fetches; msw replaces it here. An unhandled
  // request errors loudly instead of reaching the network.
  vi.unstubAllGlobals();
  serveCatalog();
});

afterEach(() => {
  sharedJsonServer.resetHandlers();
});

describe('CategoryPage', () => {
  describe('basic rendering', () => {
    it('renders parent category information', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // London dry gin is a subset of Dry Gin
      expect(screen.getByText(/is a subset of/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Dry gin/ })).toHaveAttribute(
        'href',
        '/category/dry-gin',
      );
    });

    it('renders example ingredients for the category', async () => {
      setupApp(
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

      setupApp(
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
      setupApp(
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
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Rows land from the catalog, with the list header above them.
      await waitFor(() => {
        expect(screen.getByText('Recipes using London dry gin')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Fog Cutter/ })).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /Cloister/ })).toHaveTextContent(
        'Anders Erickson',
      );
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // Fog Cutter uses 0.5 oz London dry gin (category type)
      const fogCutterLink = await screen.findByRole('link', { name: /Fog Cutter/ });
      expect(fogCutterLink).toHaveTextContent('½ oz');

      // Cloister uses 1.5 oz Beefeater London Dry Gin (spirit in category)
      const cloisterLink = await screen.findByRole('link', { name: /Cloister/ });
      expect(cloisterLink).toHaveTextContent('1 ½ oz');
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within category', async () => {
      const { user } = setupApp(
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
      const { user } = setupApp(
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
      const { user } = setupApp(
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
      const { user } = setupApp(
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
      const { user } = setupApp(
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
      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('fog');

      // With a search active, the catalog loads right away: the filtered
      // list appears once it lands.
      const resultList = await screen.findByRole('list');
      await waitFor(() => {
        expect(resultList).toHaveTextContent('Fog Cutter');
      });
      expect(resultList).not.toHaveTextContent('Cloister');
    });

    it('clearing search shows all content', async () => {
      mockRouter.setCurrentUrl('?search=fog');
      const { user } = setupApp(
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

      setupApp(
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

      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      await waitFor(() => {
        const list = getRecipeList();
        expect(list).toHaveTextContent('Zebra Tail');
        expect(list).toHaveTextContent('Alpha Yeti');
      });
    });

    it('shows the loading state while searching, not a false no-results', async () => {
      sharedJsonServer.use(hangJson('/data/catalog.json'));
      mockRouter.setCurrentUrl('?search=zebra');

      setupApp(
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

      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      // The reload affordance lives in the search branch too.
      await waitFor(() => {
        expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
    });

    it('offers a reload when the catalog fails to load', async () => {
      sharedJsonServer.use(failJson('/data/catalog.json', 500));

      setupApp(
        await CategoryPage({
          params: Promise.resolve({ slug: 'london-dry-gin' }),
        }),
      );

      await waitFor(() => {
        expect(screen.getByText('Recipes could not be loaded')).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /reload the page/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Alpha Yeti')).not.toBeInTheDocument();
    });
  });
});
