import type { Recipe } from '@cocktails/data';
import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import { buildCatalog } from '#/modules/buildCatalog';
import { getRecipeUrl } from '#/modules/url';
import { hangJson, serveJson, sharedJsonServer } from '#/testing/sharedJsonServer';
import { setupApp } from '#/vitest.setup';
import NonAlcoholicRecipesPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getNonAlcoholicRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
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

const testRecipes: Recipe[] = [mockRecipe('Bitters and Soda'), mockRecipe('Ginger Lime')];

/** The catalog as the page reads it: testRecipes keyed for this page. */
const testCatalog = buildCatalog([
  {
    key: 'list/non-alcoholic',
    recipes: testRecipes,
    pickQuantity: () => undefined,
  },
]);

beforeEach(() => {
  recipeCounter = 0;
  vi.mocked(getNonAlcoholicRecipes).mockResolvedValue(testRecipes);
  sharedJsonServer.use(serveJson('/data/catalog.json', testCatalog));
});

describe('NonAlcoholicRecipesPage', () => {
  it('renders the searchable non-alcoholic recipe list', async () => {
    await setupApp(await NonAlcoholicRecipesPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Non-Alcoholic Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /bitters and soda/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ginger lime/i })).toBeInTheDocument();
  });

  it('links to recipe detail pages', async () => {
    const recipe = mockRecipe('Test Recipe');
    vi.mocked(getNonAlcoholicRecipes).mockResolvedValue([recipe]);
    sharedJsonServer.use(
      serveJson(
        '/data/catalog.json',
        buildCatalog([
          { key: 'list/non-alcoholic', recipes: [recipe], pickQuantity: () => undefined },
        ]),
      ),
    );

    await setupApp(await NonAlcoholicRecipesPage());

    expect(screen.getByRole('link', { name: /test recipe/i })).toHaveAttribute(
      'href',
      getRecipeUrl(recipe),
    );
  });

  it('shows the loading state before the catalog lands', async () => {
    sharedJsonServer.use(hangJson('/data/catalog.json'));

    await setupApp(await NonAlcoholicRecipesPage());

    expect(screen.getByLabelText(/loading recipes/i)).toBeInTheDocument();
    expect(screen.queryByText('Bitters and Soda')).not.toBeInTheDocument();
  });

  // The catalog list's other states — the reload affordance after a failed
  // fetch — are shared SearchableRecipePage behavior, covered once on the
  // category page.

  it('renders no recipe rows when the catalog lacks the page key', async () => {
    sharedJsonServer.use(serveJson('/data/catalog.json', buildCatalog([])));

    await setupApp(await NonAlcoholicRecipesPage());

    expect(screen.queryByText('Bitters and Soda')).not.toBeInTheDocument();
  });
});
