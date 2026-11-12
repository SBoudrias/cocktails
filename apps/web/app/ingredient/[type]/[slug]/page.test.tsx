import { getIngredient, getRecipesForIngredient } from '@cocktails/data/ingredients';
import type * as IngredientsModule from '@cocktails/data/ingredients';
import { getRecipe } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { getCategoryUrl, getIngredientUrl } from '#/modules/url';
import { serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import IngredientPage from './page';

vi.mock('@cocktails/data/ingredients', async (importOriginal) => ({
  ...(await importOriginal<typeof IngredientsModule>()),
  getRecipesForIngredient: vi.fn(),
}));

// Using real pineapple-juice ingredient which has:
// - Multiple recipes (39+)
// - Duplicate recipe names (Jungle bird from multiple sources)
// - Acid adjusting calculator (has acidity property)
const TEST_INGREDIENT = {
  type: 'juice',
  slug: 'pineapple-juice',
  name: 'Pineapple juice',
};

// Using Beefeater for category/substitute tests (has categories, used in recipes)
const TEST_SPIRIT = {
  type: 'spirit',
  slug: 'beefeater-london-dry-gin',
  name: 'Beefeater London Dry Gin',
};

// A Jamaican aged rum: its most specific category (Blended aged rum
// (Jamaica)) holds 6 other bottles, and its tree has substitution-friendly
// neighboring categories.
const TEST_JAMAICAN_RUM = {
  type: 'spirit',
  slug: 'appleton-12',
  name: 'Appleton 12',
};

// A bourbon bottle: its Whiskey (Bourbon) category holds 33 bottles, past
// the substitution-list cap, so its page exercises the capped list.
const TEST_CAPPED_SPIRIT = {
  type: 'spirit',
  slug: 'bulleit-bourbon',
  name: 'Bulleit Bourbon',
};

const [pineappleRecipes, spiritRecipes, appleton21] = await Promise.all([
  Promise.all([
    getRecipe(
      { type: 'book', slug: 'smugglers-cove' },
      'jungle-bird',
      '03_The Tiki Revival',
    ),
    getRecipe(
      { type: 'book', slug: 'tiki-modern-tropical-cocktails' },
      'jungle-bird',
      '02_Essential Tiki Classics',
    ),
    getRecipe(
      { type: 'book', slug: 'smugglers-cove' },
      'chartreuse-swizzle',
      '04_Creating the Space',
    ),
  ]),
  Promise.all([
    getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'cloister'),
  ]),
  getIngredient('spirit', 'appleton-21'),
]);

vi.mocked(getRecipesForIngredient).mockImplementation(async (ingredient) => {
  if (ingredient.slug === TEST_INGREDIENT.slug) return pineappleRecipes;
  if (ingredient.slug === TEST_SPIRIT.slug) return spiritRecipes;
  return [];
});

/** The catalog as the ingredient pages read it: both test lists keyed by page. */
const testCatalog = buildCatalog([
  {
    key: `ingredient/${TEST_INGREDIENT.type}/${TEST_INGREDIENT.slug}`,
    recipes: pineappleRecipes,
    pickQuantity: (recipe) =>
      recipe.ingredients.find((i) => i.slug === TEST_INGREDIENT.slug)?.quantity,
  },
  {
    key: `ingredient/${TEST_SPIRIT.type}/${TEST_SPIRIT.slug}`,
    recipes: spiritRecipes,
    pickQuantity: (recipe) =>
      recipe.ingredients.find((i) => i.slug === TEST_SPIRIT.slug)?.quantity,
  },
]);

// Cache page JSX once for the entire file to avoid repeated async data loading
const [ingredientPageJSX, spiritPageJSX, jamaicanRumPageJSX, cappedSpiritPageJSX] =
  await Promise.all([
    IngredientPage({
      params: Promise.resolve({
        type: TEST_INGREDIENT.type,
        slug: TEST_INGREDIENT.slug,
      }),
    }),
    IngredientPage({
      params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
    }),
    IngredientPage({
      params: Promise.resolve({
        type: TEST_JAMAICAN_RUM.type,
        slug: TEST_JAMAICAN_RUM.slug,
      }),
    }),
    IngredientPage({
      params: Promise.resolve({
        type: TEST_CAPPED_SPIRIT.type,
        slug: TEST_CAPPED_SPIRIT.slug,
      }),
    }),
  ]);

describe('IngredientPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
    sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
  });

  describe('basic rendering', () => {
    it('renders SearchHeader showing ingredient name as title', async () => {
      await setupApp(ingredientPageJSX);

      expect(
        screen.getByRole('heading', { level: 1, name: TEST_INGREDIENT.name }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders category information for spirits', async () => {
      await setupApp(spiritPageJSX);

      // Beefeater categories are shown. The exact name keeps this distinct
      // from the see-all row, whose accessible name also starts with the
      // category ("London dry gin See all options").
      expect(screen.getByRole('link', { name: 'London dry gin' })).toHaveAttribute(
        'href',
        '/category/london-dry-gin',
      );
    });

    it('renders substitutes section for spirits', async () => {
      await setupApp(spiritPageJSX);

      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
    });

    it('does not render acid adjusting without acid-adjustment context', async () => {
      await setupApp(ingredientPageJSX);

      expect(screen.queryByText('Acid Adjusting')).not.toBeInTheDocument();
    });

    it('renders acid adjusting for acid-adjusted juice with acidity', async () => {
      mockRouter.setCurrentUrl('?technique=acid-adjustment');
      await setupApp(ingredientPageJSX);

      expect(screen.getByText('Acid Adjusting')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Juice amount' })).toHaveValue(1);
    });

    it('renders applicable calculators in alphabetical order', async () => {
      mockRouter.setCurrentUrl('?technique=clarification&technique=acid-adjustment');
      await setupApp(ingredientPageJSX);

      const acidAdjusting = screen.getByText('Acid Adjusting');
      const juiceClarification = screen.getByText('Juice Clarification');
      expect(
        acidAdjusting.compareDocumentPosition(juiceClarification) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(
        250,
      );
    });

    it.each(['clarification:agar', 'clarification:agar-agar'])(
      'renders clarification for %s context',
      async (technique) => {
        mockRouter.setCurrentUrl(`?technique=${technique}`);
        await setupApp(ingredientPageJSX);

        expect(screen.getByText('Juice Clarification')).toBeInTheDocument();
      },
    );

    it('prefills clarification from a recipe quantity above the contextual minimum', async () => {
      mockRouter.setCurrentUrl('?technique=clarification&amount=500&unit=gram');
      await setupApp(ingredientPageJSX);

      expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(
        500,
      );
    });

    it.each(['clarification:milk', 'clarification:bentonite'])(
      'does not render clarification for %s context',
      async (technique) => {
        mockRouter.setCurrentUrl(`?technique=${technique}`);
        await setupApp(ingredientPageJSX);

        expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
      },
    );

    it('does not render clarification for non-juice ingredients', async () => {
      mockRouter.setCurrentUrl('?technique=clarification');
      await setupApp(spiritPageJSX);

      expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
    });

    it('prefills and resets acid adjustment from the juice amount URL', async () => {
      mockRouter.setCurrentUrl('?technique=acid-adjustment&juiceAmount=0.5');
      const { user } = await setupApp(ingredientPageJSX);

      const juiceAmount = screen.getByRole('spinbutton', { name: 'Juice amount' });
      expect(juiceAmount).toHaveValue(0.5);

      await user.clear(juiceAmount);
      await user.type(juiceAmount, '2');
      await user.click(
        screen.getByRole('button', { name: 'Reset juice adjustment to defaults' }),
      );

      expect(juiceAmount).toHaveValue(0.5);
      expect(
        screen.queryByRole('heading', { name: 'Make the solution' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Lime' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Lemon' })).not.toBeInTheDocument();
      const calculatorActions = screen.getByRole('group', {
        name: 'Solution adjustment actions',
      });
      expect(
        within(calculatorActions).getByRole('link', { name: 'Full calculator' }),
      ).toHaveAttribute('href', '/calculators/acid-adjusting?juiceAmount=0.5');
      expect(
        within(calculatorActions).getByRole('button', {
          name: 'Reset juice adjustment to defaults',
        }),
      ).toBeInTheDocument();
    });
  });

  describe('substitution lists', () => {
    it('only lists bottles from the same category in the primary list', async () => {
      await setupApp(jamaicanRumPageJSX);

      // Appleton 12's most specific category is Blended aged rum (Jamaica):
      // only the 6 other bottles from that category appear.
      const substitutionGroup = screen.getByRole('group', {
        name: 'Some substitution option',
      });

      expect(substitutionGroup).toHaveTextContent('Appleton 21');
      expect(substitutionGroup).toHaveTextContent('Hampden Estate 46');
      expect(substitutionGroup).toHaveTextContent('Worthy Park Single Estate');
      // Jamaican rums from other categories stay out.
      expect(substitutionGroup).not.toHaveTextContent('Rum-Bar Silver');
      expect(substitutionGroup).not.toHaveTextContent('Smith & Cross');

      expect(
        within(substitutionGroup).getByRole('link', { name: 'Appleton 21' }),
      ).toHaveAttribute('href', getIngredientUrl(appleton21));
    });

    it('lists related categories, not bottles, in the secondary list', async () => {
      await setupApp(jamaicanRumPageJSX);

      const relatedGroup = screen.getByRole('group', {
        name: 'Substitution-friendly categories',
      });

      // Neighboring categories of Blended aged rum (Jamaica): its parents and
      // their other children, each linking to its category page.
      const relatedNames = [
        ['Blended aged rum', 'blended-aged-rum'],
        ['Blended aged rum (Barbados)', 'blended-aged-rum-barbados'],
        ['Blended aged rum (Demerara)', 'blended-aged-rum-demerara'],
        ['Blended lightly-aged rum (Jamaica)', 'blended-lightly-aged-rum-jamaica'],
        ['Jamaican overproof rum', 'jamaican-overproof-rum'],
        ['Navy strength Jamaican rum', 'navy-strength-jamaican-rum'],
      ] as const;

      for (const [name, slug] of relatedNames) {
        expect(within(relatedGroup).getByRole('link', { name })).toHaveAttribute(
          'href',
          getCategoryUrl({ slug }),
        );
      }

      // No bottle names in the category list.
      expect(relatedGroup).not.toHaveTextContent('Appleton');
      // The bottle's own broader category is linked elsewhere already.
      expect(
        within(relatedGroup).queryByRole('link', { name: 'Jamaican rum' }),
      ).not.toBeInTheDocument();
    });

    it('caps the primary list at 10 links with a see-all link last when capped', async () => {
      await setupApp(cappedSpiritPageJSX);

      // Bulleit Bourbon's category holds 32 other bottles: the list shows 9
      // of them, plus the see-all link to the category page.
      const substitutionGroup = screen.getByRole('group', {
        name: 'Some substitution option',
      });

      const links = within(substitutionGroup).getAllByRole('link');
      expect(links).toHaveLength(10);

      expect(substitutionGroup).toHaveTextContent("Baker's Bourbon");
      expect(substitutionGroup).toHaveTextContent(
        'Evan Williams 1783 Small Batch Bourbon',
      );
      // The 10th bottle onward is cut off.
      expect(substitutionGroup).not.toHaveTextContent('Evan Williams Black Label');

      // The see-all link closes the list and points at the category page.
      const seeAllLink = within(substitutionGroup).getByRole('link', {
        name: /see all/i,
      });
      expect(seeAllLink).toHaveAttribute(
        'href',
        getCategoryUrl({ slug: 'whiskey-bourbon' }),
      );
      // It is the last row of the list.
      expect(seeAllLink).toBe(links.at(-1));
    });

    it('renders no see-all link when the category fits under the cap', async () => {
      await setupApp(jamaicanRumPageJSX);

      const substitutionGroup = screen.getByRole('group', {
        name: 'Some substitution option',
      });

      expect(
        within(substitutionGroup).queryByRole('link', { name: /see all/i }),
      ).not.toBeInTheDocument();
      // All 6 same-category bottles fit under the cap.
      expect(within(substitutionGroup).getAllByRole('link')).toHaveLength(6);
    });

    it('renders no substitution section for an ingredient without categories', async () => {
      await setupApp(ingredientPageJSX);

      expect(
        screen.queryByRole('group', { name: 'Some substitution option' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('group', { name: 'Substitution-friendly categories' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('recipe list', () => {
    it('renders recipes using the ingredient with header', async () => {
      await setupApp(ingredientPageJSX);

      // setupApp flushes the catalog load: the rows and header are already there.
      // Use getByText instead of getByRole to avoid expensive accessible name computation
      expect(
        screen.getByText(`Recipes using ${TEST_INGREDIENT.name}`),
      ).toBeInTheDocument();
      expect(screen.getByText('Chartreuse swizzle').closest('a')).toBeInTheDocument();
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      await setupApp(ingredientPageJSX);

      const allListItems = screen.getAllByRole('listitem');

      // Jungle bird (Smuggler's Cove) uses 2 oz pineapple juice
      const jungleBird = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(jungleBird).toHaveTextContent('2 oz');

      // Chartreuse swizzle uses 1 oz pineapple juice
      const chartreuse = allListItems.find((item) =>
        item.textContent?.includes('Chartreuse swizzle'),
      );
      expect(chartreuse).toHaveTextContent('1 oz');
      expect(chartreuse).toHaveTextContent("Smuggler's Cove");
    });

    it('displays quantity with sources for duplicate recipe names', async () => {
      await setupApp(ingredientPageJSX);

      const allListItems = screen.getAllByRole('listitem');

      // Smuggler's Cove version: 2 oz, attributed to Smuggler's Cove book
      const smugglersCove = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(smugglersCove).toHaveTextContent('2 oz');
      expect(smugglersCove).toHaveTextContent("Smuggler's Cove");

      // Tiki Modern version: 1.5 oz (rendered as fraction), attributed to book
      const tikiModern = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle Bird') &&
          item.textContent?.includes('Tiki: Modern Tropical Cocktails'),
      );
      expect(tikiModern).toHaveTextContent('1 ½ oz');
      expect(tikiModern).toHaveTextContent('Tiki: Modern Tropical Cocktails');
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within ingredient', async () => {
      const { user } = await setupApp(ingredientPageJSX);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'chartreuse swizzle');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
      expect(resultList).not.toHaveTextContent('Jungle bird');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = await setupApp(ingredientPageJSX, {
        nuqsOptions: { onUrlUpdate },
      });

      const input = screen.getByRole('searchbox');
      await user.type(input, 'jungle');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=jungle' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = await setupApp(ingredientPageJSX);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides non-recipe content when searching', async () => {
      const { user } = await setupApp(spiritPageJSX);

      // Category info is visible initially
      expect(screen.getByText(/category is/i)).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'cloister');

      // Non-recipe content should be hidden when searching
      expect(screen.queryByText(/category is/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();
    });

    it('hides contextual calculators when searching', async () => {
      mockRouter.setCurrentUrl('?search=chartreuse&technique=clarification');
      await setupApp(ingredientPageJSX);

      expect(screen.queryByText('Acid Adjusting')).not.toBeInTheDocument();
      expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
    });

    it('loads with search term from URL', async () => {
      mockRouter.setCurrentUrl('?search=chartreuse');
      await setupApp(ingredientPageJSX);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('chartreuse');

      // With a search active, setupApp still flushes the catalog load.
      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
    });

    it('clearing search restores full page content', async () => {
      mockRouter.setCurrentUrl('?search=cloister');
      const { user } = await setupApp(spiritPageJSX);

      // Initially filtered and content hidden
      expect(screen.queryByText(/category is/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Content should be restored
      expect(screen.getByText(/category is/i)).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
      expect(screen.getByText(`Recipes using ${TEST_SPIRIT.name}`)).toBeInTheDocument();
    });
  });
});
