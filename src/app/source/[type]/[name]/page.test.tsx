import { vi, describe, it, expect, beforeAll } from 'vitest';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import SourcePage from './page';
import { getRecipeUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getSource } from '@/modules/sources';
import { getRecipesFromSource } from '@/modules/recipes';

// Cache data to avoid slow repeated data loading in CI
let cachedSource: Awaited<ReturnType<typeof getSource>> | null = null;
let cachedRecipes: Awaited<ReturnType<typeof getRecipesFromSource>> | null = null;

async function getCachedSource() {
  if (!cachedSource) {
    cachedSource = await getSource('book', 'smugglers-cove');
  }
  return cachedSource;
}

async function getCachedRecipes() {
  if (!cachedRecipes) {
    cachedRecipes = await getRecipesFromSource({ type: 'book', slug: 'smugglers-cove' });
  }
  return cachedRecipes;
}

describe('SourcePage', () => {
  // Pre-warm data cache before tests run to avoid CI timeouts
  beforeAll(async () => {
    await getCachedSource();
    await getCachedRecipes();
  });
  it('shows search input, source name as title and recipe list', async () => {
    const source = await getSource('book', 'smugglers-cove');
    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    // Title is rendered as h1
    expect(
      screen.getByRole('heading', { name: source.name, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('displays source info card', async () => {
    const source = await getSource('book', 'smugglers-cove');
    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    // SourceAboutCard renders the description and has a "Learn more" link
    expect(screen.getByText(source.description)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn more/i })).toBeInTheDocument();
  });

  it('typing filters recipe list within source', async () => {
    const { user } = setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    const recipes = await getRecipesFromSource({ type: 'book', slug: 'smugglers-cove' });
    const firstRecipe = recipes[0]!;

    const input = screen.getByRole('searchbox');
    await user.type(input, firstRecipe.name.slice(0, 5));

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(firstRecipe.name);
  });

  it('clearing search shows all recipes grouped by letter', async () => {
    const recipes = await getRecipesFromSource({ type: 'book', slug: 'smugglers-cove' });
    const firstRecipe = recipes[0]!;

    const { user } = setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
      {
        nuqsOptions: { searchParams: { search: firstRecipe.name.slice(0, 3) } },
      },
    );

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

    // All recipes should be visible, grouped by letter
    expect(screen.getAllByRole('group').length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
      {
        nuqsOptions: { onUrlUpdate },
      },
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'mai');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=mai' }),
    );
  });

  it('shows no results and SearchAllLink when search has no matches', async () => {
    const { user } = setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /search all recipes/i })).toBeInTheDocument();
  });

  it('recipe items link to correct recipe detail pages', async () => {
    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    const recipes = await getRecipesFromSource({ type: 'book', slug: 'smugglers-cove' });
    const testRecipe = recipes[0]!;

    const link = screen.getByRole('link', { name: new RegExp(testRecipe.name, 'i') });
    expect(link).toHaveAttribute('href', getRecipeUrl(testRecipe));
  });

  it('loads with search term from URL', async () => {
    const recipes = await getRecipesFromSource({ type: 'book', slug: 'smugglers-cove' });
    const testRecipe = recipes[0]!;
    const searchTerm = testRecipe.name.slice(0, 5).toLowerCase();

    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
      {
        nuqsOptions: { searchParams: { search: searchTerm } },
      },
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue(searchTerm);

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(testRecipe.name);
  });

  it('groups recipes by first letter when not searching', async () => {
    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('back button navigates correctly', async () => {
    await mockRouter.push('/');
    await mockRouter.push('/source/book/smugglers-cove');

    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'book', name: 'smugglers-cove' }),
      }),
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('works with youtube channel sources', async () => {
    const source = await getSource('youtube-channel', 'anders-erickson');
    setupApp(
      await SourcePage({
        params: Promise.resolve({ type: 'youtube-channel', name: 'anders-erickson' }),
      }),
    );

    expect(
      screen.getByRole('heading', { name: source.name, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
