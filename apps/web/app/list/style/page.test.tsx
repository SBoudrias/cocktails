import type { Recipe } from '@cocktails/data';
import { getRecipeStyles, getRecipesByStyle } from '@cocktails/data/styles';
import { screen } from '@testing-library/react';
import { beforeEach, vi, describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import StyleListPage from './page';

vi.mock('@cocktails/data/styles', () => ({
  getRecipeStyles: vi.fn(),
  getRecipesByStyle: vi.fn(),
}));

const testRecipe: Recipe = {
  name: 'Zombie',
  slug: 'zombie',
  source: {
    type: 'book',
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
};

const testStyles = [
  {
    slug: 'tiki',
    name: 'Tiki',
    description: 'Tropical drinks in the tiki tradition.',
  },
  {
    slug: 'julep',
    name: 'Julep',
    description: 'Spirit packed in crushed ice with fresh mint.',
  },
];

beforeEach(() => {
  vi.mocked(getRecipeStyles).mockReturnValue(testStyles);
  // Tiki carries recipes, julep does not: only tiki gets a row.
  vi.mocked(getRecipesByStyle).mockImplementation(async (slug: string) =>
    slug === 'tiki' ? [testRecipe] : [],
  );
});

describe('StyleListPage', () => {
  it('lists the styles that carry recipes, linking to their lists', async () => {
    await setupApp(await StyleListPage());

    expect(screen.getByText('Cocktails by Style')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tiki/i })).toHaveAttribute(
      'href',
      '/list/style/tiki',
    );
    expect(screen.queryByRole('link', { name: /julep/i })).not.toBeInTheDocument();
  });

  it('shows each style with its description', async () => {
    await setupApp(await StyleListPage());

    expect(
      screen.getByText('Tropical drinks in the tiki tradition.'),
    ).toBeInTheDocument();
  });
});
