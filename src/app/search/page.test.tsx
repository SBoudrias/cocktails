import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SearchPage from './page';
import { Recipe } from '@/types/Recipe';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/search',
}));

// Mock nuqs for query state management
vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [null, vi.fn()]),
}));

// Mock the data fetching module
vi.mock('@/modules/recipes', () => ({
  getAllRecipes: vi.fn(),
}));

// Import after mocking to get the mocked version
import { getAllRecipes } from '@/modules/recipes';

describe('Search Page Integration Tests', () => {
  const mockRecipes: Recipe[] = [
    {
      name: 'Daiquiri',
      slug: 'daiquiri',
      source: {
        type: 'youtube-channel',
        name: 'Anders Erickson',
        slug: 'anders-erickson',
        link: 'https://youtube.com/anderserickson',
        description: 'Classic cocktails',
        recipeAmount: 25,
      },
      preparation: 'shaken',
      served_on: 'up',
      glassware: 'coupe',
      servings: 1,
      ingredients: [
        {
          type: 'spirit',
          name: 'White rum',
          slug: 'white-rum',
          quantity: { amount: 2, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'juice',
          name: 'Fresh lime juice',
          slug: 'fresh-lime-juice',
          quantity: { amount: 0.75, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
          acidity: 6,
        },
        {
          type: 'syrup',
          name: 'Simple syrup',
          slug: 'simple-syrup',
          quantity: { amount: 0.75, unit: 'oz' },
          brix: 50,
          categories: [],
          refs: [],
          ingredients: [],
        },
      ],
      instructions: [
        'Add all ingredients to shaker',
        'Shake with ice',
        'Double strain into coupe',
      ],
      attributions: [],
      refs: [],
    },
    {
      name: 'Mai Tai',
      slug: 'mai-tai',
      source: {
        type: 'book',
        name: 'Smugglers Cove',
        slug: 'smugglers-cove',
        link: 'https://example.com/smugglers-cove',
        description: 'Exotic Cocktails, Rum, and the Cult of Tiki',
        recipeAmount: 103,
      },
      preparation: 'shaken',
      served_on: 'ice cubes',
      glassware: 'old fashioned',
      servings: 1,
      ingredients: [
        {
          type: 'spirit',
          name: 'Aged rum',
          slug: 'aged-rum',
          quantity: { amount: 2, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'liqueur',
          name: 'Orange curaçao',
          slug: 'orange-curacao',
          quantity: { amount: 0.75, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'syrup',
          name: 'Orgeat',
          slug: 'orgeat',
          quantity: { amount: 0.5, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'juice',
          name: 'Fresh lime juice',
          slug: 'fresh-lime-juice',
          quantity: { amount: 0.75, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
      ],
      instructions: [
        'Add all ingredients to shaker tin',
        'Fill with crushed ice and shake',
        'Pour unstrained into glass',
        'Top with more crushed ice',
        'Garnish with spent lime shell and mint sprig',
      ],
      attributions: [
        {
          relation: 'recipe author',
          source: "Trader Vic's",
          url: 'https://example.com/trader-vics',
        },
      ],
      refs: [],
    },
    {
      name: 'Negroni',
      slug: 'negroni',
      source: {
        type: 'book',
        name: 'The Craft of the Cocktail',
        slug: 'craft-of-the-cocktail',
        link: 'https://example.com/craft-cocktail',
        description: 'Classic cocktails',
        recipeAmount: 500,
      },
      preparation: 'stirred',
      served_on: 'big rock',
      glassware: 'old fashioned',
      servings: 1,
      ingredients: [
        {
          type: 'spirit',
          name: 'Gin',
          slug: 'gin',
          quantity: { amount: 1, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'liqueur',
          name: 'Campari',
          slug: 'campari',
          quantity: { amount: 1, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          type: 'wine',
          name: 'Sweet vermouth',
          slug: 'sweet-vermouth',
          quantity: { amount: 1, unit: 'oz' },
          categories: [],
          refs: [],
          ingredients: [],
        },
      ],
      attributions: [],
      refs: [],
    },
  ];

  it('should render the search page with recipes', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Wait a bit for the Search component to render (it's wrapped in Suspense)
    // The Search component should be rendered with the recipes
    // Since Search is a client component that renders RecipeList,
    // we need to check for the actual recipe content

    // Check that recipe names are displayed
    expect(await screen.findByText('Daiquiri')).toBeInTheDocument();
    expect(screen.getByText('Mai Tai')).toBeInTheDocument();
    expect(screen.getByText('Negroni')).toBeInTheDocument();
  });

  it('should display recipe metadata correctly', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Check that recipe names are displayed
    expect(await screen.findByText('Daiquiri')).toBeInTheDocument();
    expect(screen.getByText('Mai Tai')).toBeInTheDocument();
    expect(screen.getByText('Negroni')).toBeInTheDocument();

    // Source names are displayed as secondary text when recipe names are not unique
    // Since our mock has unique recipe names, sources won't be shown in the list
    // This is the expected behavior of RecipeList component
  });

  it('should render recipe list items', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Wait for recipes to render
    await screen.findByText('Daiquiri');

    // Check that we have list items for each recipe
    const listItems = screen.getAllByRole('listitem');

    // Should have at least 3 list items (one for each recipe)
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should render links to recipe detail pages', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Wait for recipes to render
    await screen.findByText('Daiquiri');

    // Check that links are created
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    // Check for specific recipe links
    const daiquiriLink = links.find((link) =>
      link.getAttribute('href')?.includes('daiquiri'),
    );
    expect(daiquiriLink).toBeDefined();
    expect(daiquiriLink?.getAttribute('href')).toContain(
      '/recipes/youtube-channel/anders-erickson/daiquiri',
    );

    const maiTaiLink = links.find((link) =>
      link.getAttribute('href')?.includes('mai-tai'),
    );
    expect(maiTaiLink).toBeDefined();
    expect(maiTaiLink?.getAttribute('href')).toContain(
      '/recipes/book/smugglers-cove/mai-tai',
    );
  });

  it('should handle empty recipe list', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue([]);

    const page = await SearchPage();
    const { container } = render(page);

    // Should render without errors even with no recipes
    expect(container).toBeDefined();
  });

  it('should display recipe metadata in list items', async () => {
    // Add duplicate recipe names to test source display
    const firstRecipe = mockRecipes[0];
    if (!firstRecipe) {
      throw new Error('Mock recipes should not be empty');
    }

    const duplicateDaiquiri: Recipe = {
      name: firstRecipe.name,
      slug: firstRecipe.slug,
      preparation: firstRecipe.preparation,
      served_on: firstRecipe.served_on,
      glassware: firstRecipe.glassware,
      servings: firstRecipe.servings,
      ingredients: firstRecipe.ingredients,
      instructions: firstRecipe.instructions,
      attributions: firstRecipe.attributions,
      refs: firstRecipe.refs,
      source: {
        type: 'book',
        name: 'Different Book',
        slug: 'different-book',
        link: 'https://example.com/different',
        description: 'Another book',
        recipeAmount: 50,
      },
    };
    const recipesWithDuplicates: Recipe[] = [...mockRecipes, duplicateDaiquiri];
    vi.mocked(getAllRecipes).mockResolvedValue(recipesWithDuplicates);

    const page = await SearchPage();
    render(page);

    // Wait for recipes to render - use getAllByText since there are duplicates
    const daiquiriElements = await screen.findAllByText('Daiquiri');
    expect(daiquiriElements.length).toBe(2); // Should have 2 Daiquiri recipes

    // Check that recipe names are displayed in list structure
    const listItems = screen.getAllByRole('listitem');

    // Find items with Daiquiri (there should be 2 now)
    const daiquiriItems = listItems.filter((item) => {
      const daiquiriTexts = within(item).queryAllByText('Daiquiri');
      return daiquiriTexts.length > 0;
    });

    // When there are duplicate names, sources should be shown
    expect(daiquiriItems.length).toBeGreaterThanOrEqual(2);

    // The Mai Tai and Negroni should still be unique
    const maiTaiItem = listItems.find((item) => {
      const texts = within(item).queryAllByText('Mai Tai');
      return texts.length > 0;
    });
    expect(maiTaiItem).toBeDefined();

    const negroniItem = listItems.find((item) => {
      const texts = within(item).queryAllByText('Negroni');
      return texts.length > 0;
    });
    expect(negroniItem).toBeDefined();

    // Also verify that sources are shown for duplicates
    expect(screen.getByText('Anders Erickson')).toBeInTheDocument();
    expect(screen.getByText('Different Book')).toBeInTheDocument();
  });

  it('should group recipes properly', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Wait for recipes to render
    await screen.findByText('Daiquiri');

    // All three recipes should be visible
    mockRecipes.forEach((recipe) => {
      expect(screen.getByText(recipe.name)).toBeInTheDocument();
    });
  });

  it('should render with proper list structure', async () => {
    vi.mocked(getAllRecipes).mockResolvedValue(mockRecipes);

    const page = await SearchPage();
    render(page);

    // Wait for recipes to render
    await screen.findByText('Daiquiri');

    // Check for list structure
    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThan(0);

    // Each recipe should be a list item with a link
    const listItems = screen.getAllByRole('listitem');
    const recipeItems = listItems.filter((item) => {
      const link = item.querySelector('a');
      return link && link.getAttribute('href')?.includes('/recipes/');
    });

    expect(recipeItems.length).toBe(mockRecipes.length);
  });
});
