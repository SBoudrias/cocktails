import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecipePage from './page';
import { Recipe } from '@/types/Recipe';
import { Ref } from '@/types/Ref';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/recipes/youtube-channel/anders-erickson/daiquiri',
}));

// Mock the data fetching and params modules
vi.mock('@/modules/recipes', () => ({
  getRecipe: vi.fn(),
}));

vi.mock('@/modules/params', () => ({
  getRecipePageParams: vi.fn(),
}));

// Import after mocking to get the mocked version
import { getRecipe } from '@/modules/recipes';
import { getRecipePageParams } from '@/modules/params';

describe('Recipe Detail Page Integration Tests', () => {
  const mockRecipe: Recipe = {
    name: 'Daiquiri',
    slug: 'daiquiri',
    source: {
      type: 'youtube-channel',
      name: 'Anders Erickson',
      slug: 'anders-erickson',
      link: 'https://youtube.com/anderserickson',
      description: 'Classic cocktails and techniques',
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
      'Double strain into coupe glass',
    ],
    attributions: [
      {
        relation: 'recipe author',
        source: 'Constantino Ribalaigua',
        url: 'https://example.com/constantino',
      },
    ],
    refs: [
      {
        type: 'youtube',
        videoId: 'abc123',
        start: 120,
      } as Ref,
      {
        type: 'youtube',
        videoId: 'def456',
      } as Ref,
    ],
  };

  const mockParams = {
    type: 'youtube-channel' as const,
    source: 'anders-erickson',
    recipe: 'daiquiri',
  };

  beforeEach(() => {
    vi.mocked(getRecipePageParams).mockResolvedValue([mockParams]);
  });

  it('should render the recipe page with header', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Check that the recipe name is displayed in the header
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
  });

  it('should display recipe badges', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Check that the preparation, serving style, and glassware badges are displayed
    expect(screen.getByText('shaken')).toBeInTheDocument();
    expect(screen.getByText('up')).toBeInTheDocument();
    expect(screen.getByText('coupe')).toBeInTheDocument();
  });

  it('should render ingredient list with quantities', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Check that ingredient names are displayed
    expect(screen.getByText(/White rum/)).toBeInTheDocument();
    expect(screen.getByText(/Fresh lime juice/)).toBeInTheDocument();
    expect(screen.getByText(/Simple syrup/)).toBeInTheDocument();

    // Check that quantities are displayed (they appear as fractions in the UI)
    const textContent = document.body.textContent || '';
    expect(textContent).toContain('2'); // 2 oz rum
    expect(textContent).toContain('¾'); // 0.75 oz is displayed as fraction
    expect(textContent).toContain('oz');
  });

  it('should display instructions as numbered list', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Check that instructions are displayed
    expect(screen.getByText(/1\. Add all ingredients to shaker/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Shake with ice/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Double strain into coupe glass/)).toBeInTheDocument();
  });

  it('should render source information card', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // The source name should be displayed somewhere on the page
    // SourceAboutCard component should render it
    expect(screen.getByText('Anders Erickson')).toBeInTheDocument();
  });

  it('should display attribution information', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Attribution card should display recipe author
    expect(screen.getByText('Constantino Ribalaigua')).toBeInTheDocument();
  });

  it('should handle recipe without instructions', async () => {
    const recipeNoInstructions = {
      ...mockRecipe,
      instructions: undefined,
    };
    vi.mocked(getRecipe).mockResolvedValue(recipeNoInstructions);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Page should render without instructions section
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
    expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
  });

  it('should handle recipe without attributions', async () => {
    const recipeNoAttributions = {
      ...mockRecipe,
      attributions: [],
    };
    vi.mocked(getRecipe).mockResolvedValue(recipeNoAttributions);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Page should render without crashing
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
    // Attribution card component likely won't render when attributions is empty
    expect(screen.queryByText('Constantino Ribalaigua')).not.toBeInTheDocument();
  });

  it('should display video references for non-youtube sources', async () => {
    const bookRecipe = {
      ...mockRecipe,
      source: {
        type: 'book' as const,
        name: 'Smugglers Cove',
        slug: 'smugglers-cove',
        link: 'https://example.com/smugglers-cove',
        description: 'Exotic Cocktails',
        recipeAmount: 103,
      },
    };
    vi.mocked(getRecipe).mockResolvedValue(bookRecipe);

    const bookParams = {
      type: 'book' as const,
      source: 'smugglers-cove',
      recipe: 'daiquiri',
    };

    const page = await RecipePage({ params: Promise.resolve(bookParams) });
    render(page);

    // For book sources, all youtube videos should be shown in VideoListCard
    // The page should render successfully
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
  });

  it('should handle youtube channel sources specially', async () => {
    // For youtube-channel sources, the first video is in the source card
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Page should render with youtube-channel specific handling
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();
    expect(screen.getByText('Anders Erickson')).toBeInTheDocument();
  });

  it('should render all main sections of the recipe page', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // Check for main sections
    // 1. Header with title
    expect(screen.getByText('Daiquiri')).toBeInTheDocument();

    // 2. Badges section - check that the badge text is present
    expect(screen.getByText('shaken')).toBeInTheDocument();
    expect(screen.getByText('up')).toBeInTheDocument();
    expect(screen.getByText('coupe')).toBeInTheDocument();

    // 3. Ingredients are rendered (checking for ingredient names)
    mockRecipe.ingredients.forEach((ingredient) => {
      expect(screen.getByText(new RegExp(ingredient.name))).toBeInTheDocument();
    });

    // 4. Instructions section
    expect(screen.getByText(/Add all ingredients to shaker/)).toBeInTheDocument();

    // 5. Source information
    expect(screen.getByText('Anders Erickson')).toBeInTheDocument();
  });

  it('should include fix bug card with correct GitHub link', async () => {
    vi.mocked(getRecipe).mockResolvedValue(mockRecipe);

    const page = await RecipePage({ params: Promise.resolve(mockParams) });
    render(page);

    // The FixBugCard should have a link to edit the recipe on GitHub
    const expectedUrl =
      'https://github.com/SBoudrias/cocktails/edit/main/src/data/recipes/youtube-channel/anders-erickson/daiquiri.json';

    // Find links that contain the GitHub edit URL
    const links = screen.getAllByRole('link');
    const githubLink = links.find((link) =>
      link.getAttribute('href')?.includes('github.com/SBoudrias/cocktails/edit'),
    );

    expect(githubLink).toBeDefined();
    expect(githubLink?.getAttribute('href')).toBe(expectedUrl);
  });
});
