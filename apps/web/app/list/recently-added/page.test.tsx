import type { Recipe } from '@cocktails/data';
import { getRecentlyAddedRecipeEntries } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import RecentlyAddedPage from './page';

vi.mock('@cocktails/data/recipes', () => ({
  getRecentlyAddedRecipeEntries: vi.fn(),
}));

const mockRecipe = (name: string, slug: string): Recipe => ({
  name,
  slug,
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
});

const daiquiri = mockRecipe('Daiquiri', 'daiquiri');
const mojito = mockRecipe('Mojito', 'mojito');
const negroni = mockRecipe('Negroni', 'negroni');

beforeEach(() => {
  vi.mocked(getRecentlyAddedRecipeEntries).mockResolvedValue([
    { recipe: daiquiri, day: '2026-05-18' },
    { recipe: mojito, day: '2026-05-18' },
    { recipe: negroni, day: '2026-05-16' },
  ]);
});

describe('RecentlyAddedPage', () => {
  it('groups recipes under the day they were added, newest day first', async () => {
    await setupApp(await RecentlyAddedPage());

    const newest = screen.getByRole('group', { name: 'May 18, 2026' });
    const oldest = screen.getByRole('group', { name: 'May 16, 2026' });
    expect(screen.getAllByRole('group')).toEqual([newest, oldest]);

    expect(
      within(newest)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['DaiquiriTest Source', 'MojitoTest Source']);
    expect(oldest).toHaveTextContent('Negroni');
    expect(oldest).not.toHaveTextContent('Daiquiri');
  });

  it('links to recipe detail pages', async () => {
    await setupApp(await RecentlyAddedPage());

    expect(screen.getByRole('link', { name: /negroni/i })).toHaveAttribute(
      'href',
      getRecipeUrl(negroni),
    );
  });

  it('renders no groups without recent recipes', async () => {
    vi.mocked(getRecentlyAddedRecipeEntries).mockResolvedValue([]);

    await setupApp(await RecentlyAddedPage());

    expect(screen.queryAllByRole('group')).toEqual([]);
  });
});
