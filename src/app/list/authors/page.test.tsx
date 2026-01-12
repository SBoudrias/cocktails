import { vi, describe, it, expect, beforeAll } from 'vitest';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import AuthorsPage from './page';
import { getAuthorRecipesUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import { getAllRecipes } from '@/modules/recipes';
import type { Recipe } from '@/types/Recipe';

// Cache recipes data to avoid slow data loading in each test
let cachedRecipes: Recipe[] | null = null;
async function getCachedRecipes() {
  if (!cachedRecipes) {
    cachedRecipes = await getAllRecipes();
  }
  return cachedRecipes;
}

describe('AuthorsPage', () => {
  // Pre-warm the recipe cache before any tests run (CI is slower)
  beforeAll(async () => {
    await getCachedRecipes();
  });

  it('shows search input, title and list', async () => {
    setupApp(await AuthorsPage());

    // Both title and search input are always visible
    expect(screen.getByText('All Authors')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    // Verify authors are shown grouped by letter
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters author list', async () => {
    const { user } = setupApp(await AuthorsPage());

    // Get a real author name to search for
    const allRecipes = await getAllRecipes();
    const authorAttribution = allRecipes
      .flatMap((r) => r.attributions)
      .find((a) => a.relation === 'recipe author' || a.relation === 'adapted by');
    const authorName = authorAttribution?.source ?? '';

    const input = screen.getByRole('searchbox');
    await user.type(input, authorName.slice(0, 5));

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(new RegExp(authorName, 'i'));
  });

  it('clearing search shows all authors grouped by letter', async () => {
    // Get a real author name for the initial search
    const allRecipes = await getAllRecipes();
    const authorAttribution = allRecipes
      .flatMap((r) => r.attributions)
      .find((a) => a.relation === 'recipe author' || a.relation === 'adapted by');
    const authorName = authorAttribution?.source ?? '';

    const { user } = setupApp(await AuthorsPage(), {
      nuqsOptions: { searchParams: { search: authorName.slice(0, 5) } },
    });

    // Initially filtered
    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(new RegExp(authorName, 'i'));

    // Clear the search input
    const input = screen.getByRole('searchbox');
    await user.clear(input);

    // All authors should be visible, grouped by letter
    // Verify groups exist (real data has many letters)
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await AuthorsPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'john');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=john' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await AuthorsPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    // SearchAllLink component is shown in empty state
    expect(screen.getByRole('link', { name: /search all recipes/i })).toBeInTheDocument();
  });

  it('author items link to correct author detail pages', async () => {
    setupApp(await AuthorsPage());

    // Find a real author and verify its link
    const allRecipes = await getAllRecipes();
    const authorsSet = new Set<string>();
    allRecipes.forEach((recipe) => {
      recipe.attributions
        .filter((a) => a.relation === 'recipe author' || a.relation === 'adapted by')
        .forEach((a) => authorsSet.add(a.source));
    });
    const authorName = Array.from(authorsSet)[0]!;

    const link = screen.getByRole('link', { name: new RegExp(authorName, 'i') });
    expect(link).toHaveAttribute('href', getAuthorRecipesUrl(authorName));
  });

  it('loads with search term from URL', async () => {
    // Get a real author name
    const allRecipes = await getAllRecipes();
    const authorAttribution = allRecipes
      .flatMap((r) => r.attributions)
      .find((a) => a.relation === 'recipe author' || a.relation === 'adapted by');
    const authorName = authorAttribution?.source ?? '';

    setupApp(await AuthorsPage(), {
      nuqsOptions: { searchParams: { search: authorName.slice(0, 5) } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue(authorName.slice(0, 5));

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(authorName);
  });

  it('groups authors by first letter when not searching', async () => {
    setupApp(await AuthorsPage());

    // Real data has authors starting with various letters
    // Just verify that letter groups exist
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    // Each group should have items (subheader + author links)
    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('back button navigates correctly', async () => {
    // Build navigation history with two pushes
    await mockRouter.push('/');
    await mockRouter.push('/list/authors');

    // Spy on back to verify it's called
    const backSpy = vi.spyOn(mockRouter, 'back');

    const { user } = setupApp(await AuthorsPage());

    const backButton = screen.getByRole('button', { name: /go back/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('shows recipe count for each author', async () => {
    setupApp(await AuthorsPage());

    // Authors should have recipe counts displayed
    // Get a real author with recipes
    const allRecipes = await getAllRecipes();
    const authorCounts = new Map<string, number>();
    allRecipes.forEach((recipe) => {
      recipe.attributions
        .filter((a) => a.relation === 'recipe author' || a.relation === 'adapted by')
        .forEach((a) => {
          authorCounts.set(a.source, (authorCounts.get(a.source) ?? 0) + 1);
        });
    });

    // Find an author with multiple recipes to verify count is displayed
    const [authorName, count] = Array.from(authorCounts.entries()).find(
      ([, c]) => c > 1,
    ) ?? ['', 0];

    if (authorName && count > 1) {
      const authorLink = screen.getByRole('link', { name: new RegExp(authorName, 'i') });
      expect(authorLink).toHaveTextContent(String(count));
    }
  });
});
