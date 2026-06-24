import { getRecentlyAddedRecipes, getRecipe } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/testing';
import RecentlyAddedPage from './page';

vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getRecentlyAddedRecipes: vi.fn(),
}));

describe('RecentlyAddedPage', () => {
  it('shows the source and chapter for every recipe', async () => {
    const recipe = await getRecipe(
      { type: 'book', slug: 'tropical-standard' },
      'daiquiri',
      '02_Preparations - Shaken - Up',
    );
    vi.mocked(getRecentlyAddedRecipes).mockResolvedValue([recipe]);

    setupApp(await RecentlyAddedPage());

    const recipeLink = screen.getByRole('link', { name: /daiquiri/i });
    expect(recipeLink).toHaveTextContent('Tropical Standard');
    expect(recipeLink).toHaveTextContent('Preparations - Shaken - Up');
  });
});
