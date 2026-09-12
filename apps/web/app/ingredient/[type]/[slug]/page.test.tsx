import {
  getIngredient,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@cocktails/data/ingredients';
import type * as IngredientsModule from '@cocktails/data/ingredients';
import { getRecipe } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import IngredientPage from './page';

vi.mock('@cocktails/data/ingredients', async (importOriginal) => ({
  ...(await importOriginal<typeof IngredientsModule>()),
  getRecipesForIngredient: vi.fn(),
  getSubstitutesForIngredient: vi.fn(),
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

const [pineappleRecipes, spiritRecipes, substitutes] = await Promise.all([
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
  Promise.all([getIngredient('spirit', 'fords-gin')]),
]);

vi.mocked(getRecipesForIngredient).mockImplementation(async (ingredient) => {
  if (ingredient.slug === TEST_INGREDIENT.slug) return pineappleRecipes;
  if (ingredient.slug === TEST_SPIRIT.slug) return spiritRecipes;
  return [];
});
vi.mocked(getSubstitutesForIngredient).mockImplementation(async (ingredient) => {
  if (ingredient.slug === TEST_SPIRIT.slug) return substitutes;
  return [];
});

// Cache page JSX once for the entire file to avoid repeated async data loading
const [ingredientPageJSX, spiritPageJSX] = await Promise.all([
  IngredientPage({
    params: Promise.resolve({ type: TEST_INGREDIENT.type, slug: TEST_INGREDIENT.slug }),
  }),
  IngredientPage({
    params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
  }),
]);

describe('IngredientPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  describe('basic rendering', () => {
    it('renders SearchHeader showing ingredient name as title', () => {
      setupApp(ingredientPageJSX);

      expect(
        screen.getByRole('heading', { level: 1, name: TEST_INGREDIENT.name }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders category information for spirits', () => {
      setupApp(spiritPageJSX);

      // Beefeater categories are shown
      expect(screen.getByText(/categor/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^London Dry Gin/i })).toHaveAttribute(
        'href',
        '/category/london-dry-gin',
      );
    });

    it('renders substitutes section for spirits', () => {
      setupApp(spiritPageJSX);

      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
    });

    it('does not render acid adjusting without acid-adjustment context', () => {
      setupApp(ingredientPageJSX);

      expect(screen.queryByText('Acid Adjusting')).not.toBeInTheDocument();
    });

    it('renders acid adjusting for acid-adjusted juice with acidity', () => {
      mockRouter.setCurrentUrl('?technique=acid-adjustment');
      setupApp(ingredientPageJSX);

      expect(screen.getByText('Acid Adjusting')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Juice amount' })).toHaveValue(1);
    });

    it('renders applicable calculators in alphabetical order', () => {
      mockRouter.setCurrentUrl('?technique=clarification&technique=acid-adjustment');
      setupApp(ingredientPageJSX);

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
      (technique) => {
        mockRouter.setCurrentUrl(`?technique=${technique}`);
        setupApp(ingredientPageJSX);

        expect(screen.getByText('Juice Clarification')).toBeInTheDocument();
      },
    );

    it('prefills clarification from a recipe quantity above the contextual minimum', () => {
      mockRouter.setCurrentUrl('?technique=clarification&amount=500&unit=gram');
      setupApp(ingredientPageJSX);

      expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(
        500,
      );
    });

    it.each(['clarification:milk', 'clarification:bentonite'])(
      'does not render clarification for %s context',
      (technique) => {
        mockRouter.setCurrentUrl(`?technique=${technique}`);
        setupApp(ingredientPageJSX);

        expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
      },
    );

    it('does not render clarification for non-juice ingredients', () => {
      mockRouter.setCurrentUrl('?technique=clarification');
      setupApp(spiritPageJSX);

      expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
    });

    it('prefills and resets acid adjustment from the juice amount URL', async () => {
      mockRouter.setCurrentUrl('?technique=acid-adjustment');
      const { user } = setupApp(ingredientPageJSX, {
        nuqsOptions: { searchParams: '?juiceAmount=0.5' },
      });

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

  describe('recipe list', () => {
    it('renders recipes using the ingredient with header', () => {
      setupApp(ingredientPageJSX);

      // Recipes section has a header
      expect(
        screen.getByText(`Recipes using ${TEST_INGREDIENT.name}`),
      ).toBeInTheDocument();

      // Chartreuse swizzle uses pineapple juice
      // Use getByText instead of getByRole to avoid expensive accessible name computation
      expect(screen.getByText('Chartreuse swizzle').closest('a')).toBeInTheDocument();
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', () => {
      setupApp(ingredientPageJSX);

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

    it('displays quantity with sources for duplicate recipe names', () => {
      setupApp(ingredientPageJSX);

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
      const { user } = setupApp(ingredientPageJSX);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'chartreuse swizzle');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
      expect(resultList).not.toHaveTextContent('Jungle bird');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(ingredientPageJSX, { nuqsOptions: { onUrlUpdate } });

      const input = screen.getByRole('searchbox');
      await user.type(input, 'jungle');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=jungle' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(ingredientPageJSX);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides non-recipe content when searching', async () => {
      const { user } = setupApp(spiritPageJSX);

      // Category info is visible initially
      expect(screen.getByText(/categor/i)).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'cloister');

      // Non-recipe content should be hidden when searching
      expect(screen.queryByText(/categor/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();
    });

    it('hides contextual calculators when searching', () => {
      mockRouter.setCurrentUrl('?search=chartreuse&technique=clarification');
      setupApp(ingredientPageJSX, {
        nuqsOptions: {
          searchParams: '?search=chartreuse&technique=clarification',
        },
      });

      expect(screen.queryByText('Acid Adjusting')).not.toBeInTheDocument();
      expect(screen.queryByText('Juice Clarification')).not.toBeInTheDocument();
    });

    it('loads with search term from URL', () => {
      setupApp(ingredientPageJSX, {
        nuqsOptions: { searchParams: '?search=chartreuse' },
      });

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('chartreuse');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
    });

    it('clearing search restores full page content', async () => {
      const { user } = setupApp(spiritPageJSX, {
        nuqsOptions: { searchParams: '?search=cloister' },
      });

      // Initially filtered and content hidden
      expect(screen.queryByText(/categor/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Content should be restored
      expect(screen.getByText(/categor/i)).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
      expect(screen.getByText(`Recipes using ${TEST_SPIRIT.name}`)).toBeInTheDocument();
    });
  });
});
