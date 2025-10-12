import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { Source } from '@/types/Source';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock the data fetching module
vi.mock('@/modules/sources', () => ({
  getAllSources: vi.fn(),
}));

// Import after mocking to get the mocked version
import { getAllSources } from '@/modules/sources';

describe('Home Page Integration Tests', () => {
  const mockSources: Source[] = [
    {
      type: 'book',
      name: 'Smugglers Cove',
      slug: 'smugglers-cove',
      link: 'https://example.com/smugglers-cove',
      description: 'Exotic Cocktails, Rum, and the Cult of Tiki',
      recipeAmount: 103,
    },
    {
      type: 'book',
      name: 'Death & Co',
      slug: 'death-and-co',
      link: 'https://example.com/death-and-co',
      description: 'Modern Classic Cocktails',
      recipeAmount: 500,
    },
    {
      type: 'youtube-channel',
      name: 'Anders Erickson',
      slug: 'anders-erickson',
      link: 'https://youtube.com/anderserickson',
      description: 'Classic cocktails and techniques',
      recipeAmount: 25,
    },
    {
      type: 'youtube-channel',
      name: 'How to Drink',
      slug: 'how-to-drink',
      link: 'https://youtube.com/howtodrink',
      description: 'Cocktail education and entertainment',
      recipeAmount: 150,
    },
    {
      type: 'podcast',
      name: 'Bartender at Large',
      slug: 'bartender-at-large',
      link: 'https://example.com/bartender-at-large',
      description: 'Cocktail podcast',
      recipeAmount: 10,
    },
  ];

  it('should render the home page with header', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check that the header with title is rendered
    expect(screen.getByText('Cocktail Index')).toBeInTheDocument();
  });

  it('should render all navigation sections', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for section headers using semantic queries
    // MUI ListSubheader elements are not headers semantically, so we check for text content
    expect(screen.getByText('Calculators')).toBeInTheDocument();
    expect(screen.getByText('By Books')).toBeInTheDocument();
    expect(screen.getByText('By Youtube Channels')).toBeInTheDocument();
    expect(screen.getByText('By Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Other lists')).toBeInTheDocument();
  });

  it('should render the All Recipes link', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Find the All Recipes link
    const allRecipesLink = screen.getByText('All Recipes');
    expect(allRecipesLink).toBeInTheDocument();

    // Verify it's within a link element
    const linkElement = allRecipesLink.closest('a');
    expect(linkElement).toHaveAttribute('href', '/search');
  });

  it('should render calculator links', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for calculator links
    const acidAdjusting = screen.getByText('Acid Adjusting');
    expect(acidAdjusting).toBeInTheDocument();
    expect(acidAdjusting.closest('a')).toHaveAttribute(
      'href',
      '/calculators/acid-adjusting',
    );

    const brixCalculator = screen.getByText('Sugar Adjusting (Brix calculator)');
    expect(brixCalculator).toBeInTheDocument();
    expect(brixCalculator.closest('a')).toHaveAttribute('href', '/calculators/brix');

    const salineCalculator = screen.getByText('Saline Solution Calculator');
    expect(salineCalculator).toBeInTheDocument();
    expect(salineCalculator.closest('a')).toHaveAttribute('href', '/calculators/saline');
  });

  it('should render book sources with recipe counts', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for book sources
    expect(screen.getByText('Smugglers Cove')).toBeInTheDocument();
    expect(screen.getByText('Death & Co')).toBeInTheDocument();

    // Check for recipe counts - they appear as separate text elements
    expect(screen.getByText('103')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('should render youtube channel sources', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for youtube sources
    expect(screen.getByText('Anders Erickson')).toBeInTheDocument();
    expect(screen.getByText('How to Drink')).toBeInTheDocument();

    // Check for recipe counts
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should render podcast sources', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for podcast sources
    expect(screen.getByText('Bartender at Large')).toBeInTheDocument();

    // Check for recipe count
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render other list links', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Check for other list links
    const authorsLink = screen.getByText('By Authors');
    expect(authorsLink).toBeInTheDocument();
    expect(authorsLink.closest('a')).toHaveAttribute('href', '/list/authors');

    const barsLink = screen.getByText('By Bars');
    expect(barsLink).toBeInTheDocument();
    expect(barsLink.closest('a')).toHaveAttribute('href', '/list/bars');

    const ingredientsLink = screen.getByText('All Ingredients');
    expect(ingredientsLink).toBeInTheDocument();
    expect(ingredientsLink.closest('a')).toHaveAttribute('href', '/list/ingredients');

    const bottlesLink = screen.getByText('All Bottles');
    expect(bottlesLink).toBeInTheDocument();
    expect(bottlesLink.closest('a')).toHaveAttribute('href', '/list/bottles');
  });

  it('should handle empty sources gracefully', async () => {
    vi.mocked(getAllSources).mockResolvedValue([]);

    const page = await HomePage();
    render(page);

    // Page should still render with headers but no source items
    expect(screen.getByText('Cocktail Index')).toBeInTheDocument();
    expect(screen.getByText('By Books')).toBeInTheDocument();
    expect(screen.getByText('By Youtube Channels')).toBeInTheDocument();
    expect(screen.getByText('By Podcasts')).toBeInTheDocument();
  });

  it('should properly group sources by type', async () => {
    vi.mocked(getAllSources).mockResolvedValue(mockSources);

    const page = await HomePage();
    render(page);

    // Get all list items
    const listItems = screen.getAllByRole('listitem');

    // We should have multiple list items for sources and navigation
    expect(listItems.length).toBeGreaterThan(0);

    // Verify sources are rendered (text is present)
    mockSources.forEach((source) => {
      expect(screen.getByText(source.name)).toBeInTheDocument();
    });
  });
});
