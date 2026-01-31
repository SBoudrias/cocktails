import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { setupApp } from '@/testing';
import IngredientPage from './page';

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

describe('IngredientPage', () => {
  describe('basic rendering', () => {
    it('renders SearchHeader showing ingredient name as title', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: TEST_INGREDIENT.name }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders category information for spirits', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
        }),
      );

      // Beefeater categories are shown
      expect(screen.getByText(/categor/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^London Dry Gin/i })).toHaveAttribute(
        'href',
        '/category/london-dry-gin',
      );
    });

    it('renders substitutes section for spirits', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
        }),
      );

      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
    });

    it('renders acid adjusting calculator for juices with acidity', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      expect(screen.getByText('Acid Adjusting')).toBeInTheDocument();
    });
  });

  describe('recipe list', () => {
    it('renders recipes using the ingredient with header', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      // Recipes section has a header
      expect(
        screen.getByText(`Recipes using ${TEST_INGREDIENT.name}`),
      ).toBeInTheDocument();

      // Chartreuse swizzle uses pineapple juice
      expect(
        screen.getByRole('link', { name: /Chartreuse swizzle/ }),
      ).toBeInTheDocument();
    });
  });

  describe('recipe list quantity display', () => {
    it('displays ingredient quantity for each recipe', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      const allListItems = screen.getAllByRole('listitem');

      // Jungle bird (Smuggler's Cove) uses 2 oz pineapple juice
      const jungleBird = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(jungleBird).toHaveTextContent('2oz');

      // Chartreuse swizzle uses 1 oz pineapple juice
      const chartreuse = allListItems.find((item) =>
        item.textContent?.includes('Chartreuse swizzle'),
      );
      expect(chartreuse).toHaveTextContent('1oz');
    });

    it('displays quantity with attribution for duplicate recipe names', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      const allListItems = screen.getAllByRole('listitem');

      // Smuggler's Cove version: 2 oz, attributed to Smuggler's Cove book
      const smugglersCove = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle bird') &&
          item.textContent?.includes("Smuggler's Cove"),
      );
      expect(smugglersCove).toHaveTextContent('2oz');
      expect(smugglersCove).toHaveTextContent("Smuggler's Cove");

      // Tiki Modern version: 1.5 oz (rendered as fraction), attributed to book
      const tikiModern = allListItems.find(
        (item) =>
          item.textContent?.includes('Jungle Bird') &&
          item.textContent?.includes('Tiki: Modern Tropical Cocktails'),
      );
      expect(tikiModern).toHaveTextContent('1 ½oz');
      expect(tikiModern).toHaveTextContent('Tiki: Modern Tropical Cocktails');
    });

    it('does not show attribution for unique recipe names', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      // Chartreuse swizzle is unique (only one recipe with that name)
      // Find the specific link, then get the listitem inside it (MUI ListItem is child of Next.js Link)
      const chartreuseLink = screen.getByRole('link', { name: /Chartreuse swizzle/ });

      // Should show quantity but NOT source attribution
      expect(chartreuseLink).toHaveTextContent('1oz');
      expect(chartreuseLink).not.toHaveTextContent("Smuggler's Cove");
    });
  });

  describe('search functionality', () => {
    it('search filters recipes within ingredient', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'chartreuse swizzle');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
      expect(resultList).not.toHaveTextContent('Jungle bird');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'jungle');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=jungle' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('hides non-recipe content when searching', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
        }),
      );

      // Category info is visible initially
      expect(screen.getByText(/categor/i)).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'cloister');

      // Non-recipe content should be hidden when searching
      expect(screen.queryByText(/categor/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();
    });

    it('loads with search term from URL', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({
            type: TEST_INGREDIENT.type,
            slug: TEST_INGREDIENT.slug,
          }),
        }),
        { nuqsOptions: { searchParams: '?search=chartreuse' } },
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('chartreuse');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Chartreuse swizzle');
    });

    it('clearing search restores full page content', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: TEST_SPIRIT.type, slug: TEST_SPIRIT.slug }),
        }),
        { nuqsOptions: { searchParams: '?search=cloister' } },
      );

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
