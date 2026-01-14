import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type * as IngredientsModuleType from '@/modules/ingredients';
import type { RootIngredient } from '@/types/Ingredient';
import type { Recipe } from '@/types/Recipe';
import type { Source } from '@/types/Source';
import {
  getIngredient,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@/modules/ingredients';
import { getRecipeUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import IngredientPage from './page';

const ingredientsModule = await vi.importActual<typeof IngredientsModuleType>(
  '@/modules/ingredients',
);

vi.mock('@/modules/ingredients', () => ({
  getIngredient: vi.fn(),
  getRecipesForIngredient: vi.fn(),
  getSubstitutesForIngredient: vi.fn(),
}));

const mockSource: Source = {
  type: 'book',
  name: 'Test Cocktail Book',
  slug: 'test-cocktail-book',
  link: 'https://example.com/book',
  description: 'A test book about cocktails',
  recipeAmount: 3,
};

const mockIngredient: RootIngredient = {
  name: 'Test Rum',
  slug: 'test-rum',
  type: 'spirit',
  description: 'A fine test rum for cocktails',
  categories: [
    {
      name: 'Jamaican Rum',
      slug: 'jamaican-rum',
      type: 'category',
      parents: [],
      refs: [],
    },
  ],
  refs: [],
  ingredients: [],
};

const mockSubstitute: RootIngredient = {
  name: 'Another Rum',
  slug: 'another-rum',
  type: 'spirit',
  categories: [
    {
      name: 'Jamaican Rum',
      slug: 'jamaican-rum',
      type: 'category',
      parents: [],
      refs: [],
    },
  ],
  refs: [],
  ingredients: [],
};

let recipeCounter = 0;

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: mockSource,
  attributions: [],
  ingredients: [
    {
      ...mockIngredient,
      quantity: { amount: 2, unit: 'oz' },
    },
  ],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
});

const testRecipes: Recipe[] = [
  mockRecipe('Mojito'),
  mockRecipe('Daiquiri'),
  mockRecipe('Mai Tai'),
];

describe('IngredientPage', () => {
  describe('search functionality', () => {
    beforeEach(() => {
      recipeCounter = 0;
      vi.mocked(getIngredient).mockResolvedValue(mockIngredient);
      vi.mocked(getSubstitutesForIngredient).mockResolvedValue([mockSubstitute]);
      vi.mocked(getRecipesForIngredient).mockResolvedValue(testRecipes);
    });

    it('renders SearchHeader showing ingredient name as title', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Test Rum' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders ingredient description card', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      expect(screen.getByText('A fine test rum for cocktails')).toBeInTheDocument();
    });

    it('renders substitutes section', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
      expect(screen.getByText('Another Rum')).toBeInTheDocument();
    });

    it('displays recipe list grouped by letter when not searching', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      const dGroup = screen.getByRole('group', { name: 'D' });
      expect(dGroup).toHaveTextContent('Daiquiri');

      const mGroup = screen.getByRole('group', { name: 'M' });
      expect(mGroup).toHaveTextContent('Mojito');
      expect(mGroup).toHaveTextContent('Mai Tai');
    });

    it('search filters recipes within ingredient only', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'moj');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Mojito');
      expect(resultList).not.toHaveTextContent('Daiquiri');
      expect(resultList).not.toHaveTextContent('Mai Tai');
    });

    it('URL updates with search param', async () => {
      const onUrlUpdate = vi.fn();
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
        { nuqsOptions: { onUrlUpdate } },
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'dai');

      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?search=dai' }),
      );
    });

    it('shows SearchAllLink in no results state', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /search all recipes/i }),
      ).toBeInTheDocument();
    });

    it('recipe items link to correct recipe detail pages', async () => {
      const testRecipe = mockRecipe('Test Recipe');
      vi.mocked(getRecipesForIngredient).mockResolvedValue([testRecipe]);

      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      const link = screen.getByRole('link', { name: /test recipe/i });
      expect(link).toHaveAttribute('href', getRecipeUrl(testRecipe));
    });

    it('hides ingredient description when searching', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      // Description is visible initially
      expect(screen.getByText('A fine test rum for cocktails')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'moj');

      // Description should be hidden when searching
      expect(screen.queryByText('A fine test rum for cocktails')).not.toBeInTheDocument();
    });

    it('hides substitutes section when searching', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      // Substitutes are visible initially
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();
      expect(screen.getByText('Another Rum')).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      await user.type(input, 'moj');

      // Substitutes should be hidden when searching
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Rum')).not.toBeInTheDocument();
    });

    it('back button navigates correctly', async () => {
      await mockRouter.push('/');
      await mockRouter.push('/ingredient/spirit/test-rum');

      const backSpy = vi.spyOn(mockRouter, 'back');

      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
      );

      const backButton = screen.getByRole('button', { name: /go back/i });
      await user.click(backButton);

      expect(backSpy).toHaveBeenCalled();
      backSpy.mockRestore();
    });

    it('loads with search term from URL', async () => {
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
        { nuqsOptions: { searchParams: '?search=daiquiri' } },
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('daiquiri');

      const resultList = screen.getByRole('list');
      expect(resultList).toHaveTextContent('Daiquiri');
      expect(resultList).not.toHaveTextContent('Mojito');
    });

    it('clearing search restores full page content', async () => {
      const { user } = setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
        }),
        { nuqsOptions: { searchParams: '?search=moj' } },
      );

      // Initially filtered and content hidden
      expect(screen.queryByText('A fine test rum for cocktails')).not.toBeInTheDocument();
      expect(screen.queryByText('Some substitution option')).not.toBeInTheDocument();

      // Clear the search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Content should be restored
      expect(screen.getByText('A fine test rum for cocktails')).toBeInTheDocument();
      expect(screen.getByText('Some substitution option')).toBeInTheDocument();

      // All recipes should be visible, grouped by letter
      const mGroup = screen.getByRole('group', { name: 'M' });
      expect(mGroup).toHaveTextContent('Mojito');
      expect(mGroup).toHaveTextContent('Mai Tai');

      const dGroup = screen.getByRole('group', { name: 'D' });
      expect(dGroup).toHaveTextContent('Daiquiri');
    });

    describe('with ingredient without recipes', () => {
      beforeEach(() => {
        vi.mocked(getRecipesForIngredient).mockResolvedValue([]);
      });

      it('renders page without recipe list', async () => {
        setupApp(
          await IngredientPage({
            params: Promise.resolve({ type: 'spirit', slug: 'test-rum' }),
          }),
        );

        expect(
          screen.getByRole('heading', { level: 1, name: 'Test Rum' }),
        ).toBeInTheDocument();
        expect(screen.getByText('A fine test rum for cocktails')).toBeInTheDocument();
        // No recipe groups should exist
        expect(screen.queryByRole('group')).not.toBeInTheDocument();
      });
    });
  });

  describe('recipe list quantity display', () => {
    beforeEach(() => {
      vi.mocked(getIngredient).mockImplementation(ingredientsModule.getIngredient);
      vi.mocked(getSubstitutesForIngredient).mockImplementation(
        ingredientsModule.getSubstitutesForIngredient,
      );
      vi.mocked(getRecipesForIngredient).mockImplementation(
        ingredientsModule.getRecipesForIngredient,
      );
    });
    it('displays ingredient quantity for each recipe', async () => {
      // Pineapple juice is used in 39+ recipes with various quantities
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
        }),
      );

      // Get all listitems and find by text content
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
      // Pineapple juice has two "Jungle bird" recipes from different sources:
      // - "Jungle bird" from Smuggler's Cove (2 oz pineapple juice)
      // - "Jungle Bird" from Tiki Modern (1.5 oz pineapple juice, rendered as 1 ½oz)
      setupApp(
        await IngredientPage({
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
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
          params: Promise.resolve({ type: 'juice', slug: 'pineapple-juice' }),
        }),
      );

      const allListItems = screen.getAllByRole('listitem');

      // Chartreuse swizzle is unique (only one recipe with that name)
      const chartreuse = allListItems.find((item) =>
        item.textContent?.includes('Chartreuse swizzle'),
      );

      // Should show quantity but NOT source attribution
      expect(chartreuse).toHaveTextContent('1oz');
      expect(chartreuse).not.toHaveTextContent("Smuggler's Cove");
    });
  });
});
