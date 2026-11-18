import type { Recipe } from '@cocktails/data';
import {
  getRecipeStyle,
  getRecipeStyles,
  getRecipesByStyle,
} from '@cocktails/data/styles';
import { screen } from '@testing-library/react';
import { beforeEach, vi, describe, expect, it } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { getRecipeUrl } from '#/modules/url';
import { hangJson, serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import StyleRecipesPage from './page';

vi.mock('@cocktails/data/styles', () => ({
  getRecipeStyles: vi.fn(),
  getRecipeStyle: vi.fn(),
  getRecipesByStyle: vi.fn(),
}));

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
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

const tikiStyle = { slug: 'tiki', name: 'Tiki', description: 'Tropical drinks.' };
const zombie = mockRecipe('Zombie');
const testRecipes: Recipe[] = [zombie, mockRecipe('Fog Cutter')];

/** The catalog as the page reads it: testRecipes keyed for the tiki style. */
const testCatalog = buildCatalog([
  { key: 'list/style/tiki', recipes: testRecipes, pickQuantity: () => undefined },
]);

beforeEach(() => {
  vi.mocked(getRecipeStyles).mockReturnValue([tikiStyle]);
  vi.mocked(getRecipeStyle).mockReturnValue(tikiStyle);
  vi.mocked(getRecipesByStyle).mockResolvedValue(testRecipes);
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('StyleRecipesPage', () => {
  it('renders the searchable style recipe list', async () => {
    await setupApp(await StyleRecipesPage({ params: Promise.resolve({ slug: 'tiki' }) }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tiki Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /zombie/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fog cutter/i })).toBeInTheDocument();
  });

  it('shows the style description', async () => {
    await setupApp(await StyleRecipesPage({ params: Promise.resolve({ slug: 'tiki' }) }));

    expect(screen.getByText('Tropical drinks.')).toBeInTheDocument();
  });

  it('links to recipe detail pages', async () => {
    await setupApp(await StyleRecipesPage({ params: Promise.resolve({ slug: 'tiki' }) }));

    expect(screen.getByRole('link', { name: /zombie/i })).toHaveAttribute(
      'href',
      getRecipeUrl(zombie),
    );
  });

  it('renders no recipe rows when the catalog lacks the page key', async () => {
    sharedJsonServer.use(serveJson('/data/catalog.json', buildCatalog([])));

    await setupApp(await StyleRecipesPage({ params: Promise.resolve({ slug: 'tiki' }) }));

    expect(screen.queryByText('Zombie')).not.toBeInTheDocument();
  });

  it('shows the loading state before the catalog lands', async () => {
    sharedJsonServer.use(hangJson('/data/catalog.json'));

    await setupApp(await StyleRecipesPage({ params: Promise.resolve({ slug: 'tiki' }) }));

    expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
  });
});
