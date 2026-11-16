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

    it('renders category chips under the title for spirits', async () => {
      await setupApp(spiritPageJSX);

      // Beefeater's categories sit in the chips group right under the page
      // title. The exact name keeps this distinct from the see-all row,
      // whose accessible name also starts with the category ("London dry gin
      // See all options").
      const chipsGroup = screen.getByRole('group', { name: 'Categories' });
      expect(
        within(chipsGroup).getByRole('link', { name: 'London dry gin' }),
      ).toHaveAttribute('href', '/category/london-dry-gin');

      // The chips sit between the title and the rest of the page content.
      const title = screen.getByRole('heading', {
        level: 1,
        name: TEST_SPIRIT.name,
      });
      expect(
        title.compareDocumentPosition(chipsGroup) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        chipsGroup.compareDocumentPosition(screen.getByText('Some substitution option')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
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
        within(substitutionGroup).getByRole('link', { name: /^Appleton 21/ }),
      ).toHaveAttribute('href', getIngredientUrl(appleton21));
    });

    it('orders the primary list by recipe count and shows the count', async () => {
      await setupApp(jamaicanRumPageJSX);

      const substitutionGroup = screen.getByRole('group', {
        name: 'Some substitution option',
      });

      // Recipe counts on the Blended aged rum (Jamaica) shelf: Appleton 8
      // leads with 17 recipes, then Hamilton's gold (5), Hampden Estate 46
      // (3); Appleton 21 (1) trails with the other single-recipe bottles.
      const hrefs = within(substitutionGroup)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'));

      const order = (slug: string) => hrefs.indexOf(`/ingredient/spirit/${slug}`);
      expect(order('appleton-8')).toBeLessThan(order('hamilton-jamaican-pot-still-gold'));
      expect(order('hamilton-jamaican-pot-still-gold')).toBeLessThan(
        order('hampden-estate-46'),
      );
      expect(order('hampden-estate-46')).toBeLessThan(order('appleton-21'));

      // Every bottle row carries its recipe count next to the name.
      expect(substitutionGroup).toHaveTextContent('17');
      expect(substitutionGroup).toHaveTextContent('5');
      expect(substitutionGroup).toHaveTextContent('3');
      expect(substitutionGroup).toHaveTextContent('1');
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

      // Popularity ordering: the most-used bourbons lead — Elijah Craig
      // (27), Old Grand-Dad Bonded (19), Buffalo Trace (17)...
      expect(substitutionGroup).toHaveTextContent('Elijah Craig bourbon');
      expect(substitutionGroup).toHaveTextContent('Old Grand-Dad Bonded Bourbon');
      expect(substitutionGroup).toHaveTextContent('Buffalo Trace Bourbon');
      // The 10th most-used bourbon onward is cut off.
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

      // Category chips are visible initially
      expect(screen.getByRole('group', { name: 'Categories' })).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'cloister');

      // Non-recipe content should be hidden when searching
      expect(screen.queryByRole('group', { name: 'Categories' })).not.toBeInTheDocument();
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
      expect(screen.queryByRole('group', { name: 'Categories' })).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Content should be restored
      expect(screen.getByRole('group', { name: 'Categories' })).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
      expect(screen.getByText(`Recipes using ${TEST_SPIRIT.name}`)).toBeInTheDocument();
    });
  });

  describe('substitution drawer', () => {
    it('offers a Substitutions trigger under the category chips', async () => {
      await setupApp(spiritPageJSX);

      const trigger = screen.getByRole('button', { name: 'Substitutions' });
      const chipsGroup = screen.getByRole('group', { name: 'Categories' });
      expect(
        chipsGroup.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('renders no trigger for an ingredient without substitutions', async () => {
      await setupApp(ingredientPageJSX);

      expect(
        screen.queryByRole('button', { name: 'Substitutions' }),
      ).not.toBeInTheDocument();
    });

    it('opens the substitution lists in the sheet, reusing the page lists', async () => {
      const { user } = await setupApp(jamaicanRumPageJSX);

      await user.click(screen.getByRole('button', { name: 'Substitutions' }));

      const sheet = screen.getByRole('dialog', { name: 'Substitutions' });
      const sheetList = within(sheet).getByRole('group', {
        name: 'Some substitution option',
      });
      expect(sheetList).toHaveTextContent('Appleton 21');
      expect(
        within(sheet).getByRole('group', { name: 'Substitution-friendly categories' }),
      ).toHaveTextContent('Blended aged rum');

      // The sheet describes what it substitutes.
      expect(sheet).toHaveTextContent(`in place of ${TEST_JAMAICAN_RUM.name}.`);

      // The inline desktop copy stays in the page: the mobile split is CSS
      // only, both lists render from the same SubstitutionLists.
      const inlineList = screen
        .getAllByRole('group', { name: 'Some substitution option' })
        .find((group) => !sheet.contains(group));
      expect(inlineList).toBeDefined();

      // The two copies' group headers never collide on their ids: each
      // list's header id is unique per instance (LinkList's useId).
      const inlineHeaderId = inlineList?.getAttribute('aria-labelledby');
      expect(inlineHeaderId).toBeDefined();
      const sheetHeaderIds = [...sheet.querySelectorAll('[role="group"]')]
        .map((group) => group.getAttribute('aria-labelledby'))
        .filter((id): id is string => id != null);
      expect(sheetHeaderIds.length).toBeGreaterThan(0);
      for (const id of sheetHeaderIds) {
        expect(id).not.toBe(inlineHeaderId);
      }
    });

    it('is modal: traps focus in the sheet while open', async () => {
      const { user } = await setupApp(jamaicanRumPageJSX);

      await user.click(screen.getByRole('button', { name: 'Substitutions' }));

      const sheet = screen.getByRole('dialog', { name: 'Substitutions' });
      expect(sheet).toHaveAttribute('aria-modal', 'true');

      // The sheet opens with focus on its content (initialFocus="content"),
      // never on the page behind it.
      expect(sheet).toHaveFocus();

      // Tab cycles inside the sheet only: the page's searchbox and links
      // stay out of reach while the modal is open. Tabbing past every
      // focusable in the sheet plus one proves the wrap.
      const focusables =
        within(sheet).getAllByRole('link').length +
        within(sheet).getAllByRole('button').length;
      for (let tab = 0; tab < focusables + 1; tab++) await user.tab();
      expect(sheet.contains(document.activeElement)).toBe(true);
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const { user } = await setupApp(jamaicanRumPageJSX);

      const trigger = screen.getByRole('button', { name: 'Substitutions' });
      await user.click(trigger);
      expect(screen.getByRole('dialog', { name: 'Substitutions' })).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(
        screen.queryByRole('dialog', { name: 'Substitutions' }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('closes from the sheet close button', async () => {
      const { user } = await setupApp(jamaicanRumPageJSX);

      await user.click(screen.getByRole('button', { name: 'Substitutions' }));
      await user.click(screen.getByRole('button', { name: 'Close substitutions' }));

      expect(
        screen.queryByRole('dialog', { name: 'Substitutions' }),
      ).not.toBeInTheDocument();
    });

    it('splits by breakpoint: the trigger hides at 600px, the inline lists below it', async () => {
      await setupApp(jamaicanRumPageJSX);

      // happy-dom applies no CSS: the split lives in the classes — the
      // trigger hidden at or above 600px (the app chrome's own breakpoint,
      // --app-bar-height), the inline lists hidden below it.
      const triggerWrapper = screen
        .getByRole('button', { name: 'Substitutions' })
        .closest('div');
      expect(triggerWrapper).toHaveClass('min-[600px]:hidden');

      // With the sheet closed only the inline copy exists, and it hides
      // below 600px (hidden min-[600px]:block).
      const inlineList = screen.getByRole('group', {
        name: 'Some substitution option',
      });
      const inlineWrapper = inlineList.closest('div.hidden');
      expect(inlineWrapper).toHaveClass('min-[600px]:block');
    });
  });
});
