import type { Recipe, Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import { screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import HomePage from './page';

vi.mock('@cocktails/data/recipes', () => ({
  getRecentlyAddedRecipes: vi.fn(),
}));

vi.mock('@cocktails/data/sources', () => ({
  getAllSources: vi.fn(),
}));

const testRecipe: Recipe = {
  name: 'Daiquiri',
  slug: 'daiquiri',
  source: {
    type: 'book',
    name: 'Test Book',
    slug: 'test-book',
    link: 'https://example.com',
    description: 'Test book',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
};

const testSources: Source[] = [];

beforeEach(() => {
  vi.mocked(getAllSources).mockResolvedValue(testSources);
  vi.mocked(getRecentlyAddedRecipes).mockResolvedValue([testRecipe]);
});

describe('HomePage', () => {
  it('lists calculators alphabetically', async () => {
    setupApp(await HomePage());

    const calculators = screen.getByText('Calculators').closest('ul');
    if (calculators == null) {
      throw new Error('Expected the calculators section to be rendered');
    }

    expect(
      within(calculators)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Acid Adjusting',
      'Juice Clarification',
      'Milk Clarification',
      'Saline Solution Calculator',
      'Sugar Adjusting (Brix calculator)',
    ]);
    expect(
      within(calculators).getByRole('link', { name: 'Juice Clarification' }),
    ).toHaveAttribute('href', '/calculators/juice-clarification');
    expect(
      within(calculators).getByRole('link', { name: 'Milk Clarification' }),
    ).toHaveAttribute('href', '/calculators/milk-clarification');
  });
  it('links to recently added recipes when recent recipe data is available', async () => {
    setupApp(await HomePage());

    expect(screen.getByRole('link', { name: /recently added/i })).toHaveAttribute(
      'href',
      '/list/recently-added',
    );
  });

  it('hides the recently added link when recent recipe data is unavailable', async () => {
    vi.mocked(getRecentlyAddedRecipes).mockResolvedValue([]);

    setupApp(await HomePage());

    expect(
      screen.queryByRole('link', { name: /recently added/i }),
    ).not.toBeInTheDocument();
  });

  it('links to the non-alcoholic recipe list', async () => {
    setupApp(await HomePage());

    expect(screen.getByRole('link', { name: 'Non-Alcoholic Recipes' })).toHaveAttribute(
      'href',
      '/list/non-alcoholic',
    );
  });
});
