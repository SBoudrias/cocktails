import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IngredientType, RecipeIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';

const execFileMocks = vi.hoisted(() => {
  const promise = vi.fn();
  const callback = Object.assign(vi.fn(), {
    [Symbol.for('nodejs.util.promisify.custom')]: promise,
  });
  return { callback, promise };
});

vi.mock('node:child_process', () => ({
  execFile: execFileMocks.callback,
}));

beforeEach(() => {
  vi.resetModules();
  execFileMocks.promise.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('getRecentlyAddedRecipes', () => {
  it('orders recipes by git file-add date instead of recipe name', async () => {
    const repoRoot = process.cwd();
    const gitLog = [
      'COMMIT 2026-05-16T13:10:12-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/9th-wonder.json',
      'COMMIT 2026-05-18T09:00:00-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/snake-eyes.json',
      'packages/data/data/recipes/youtube-channel/anders-erickson/belmont-jewel.json',
    ].join('\n');

    execFileMocks.promise.mockImplementation((command, args, options) => {
      if (args.includes('--show-toplevel')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }
      if (args.includes('--is-shallow-repository')) {
        return Promise.resolve({ stdout: 'false\n', stderr: '' });
      }

      expect(command).toBe('git');
      expect(options).toEqual({ cwd: repoRoot });
      expect(args).toContain('--diff-filter=A');
      return Promise.resolve({ stdout: gitLog, stderr: '' });
    });

    const { getRecentlyAddedRecipes } = await import('./recipes');
    const recipes = await getRecentlyAddedRecipes();

    expect(recipes.map((recipe) => recipe.name)).toEqual([
      'Snake Eyes',
      'Belmont Jewel',
      '9th Wonder',
    ]);
  });

  it('skips recently added recipes that have since been deleted', async () => {
    const repoRoot = process.cwd();
    const gitLog = [
      'COMMIT 2026-05-19T09:00:00-04:00',
      'packages/data/data/recipes/youtube-channel/make-and-drink/amaretto-sour-make-and-drink.json',
      'COMMIT 2026-05-18T09:00:00-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/snake-eyes.json',
      'packages/data/data/recipes/youtube-channel/anders-erickson/belmont-jewel.json',
    ].join('\n');

    execFileMocks.promise.mockImplementation((command, args, options) => {
      if (args.includes('--show-toplevel')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }
      if (args.includes('--is-shallow-repository')) {
        return Promise.resolve({ stdout: 'false\n', stderr: '' });
      }

      expect(command).toBe('git');
      expect(options).toEqual({ cwd: repoRoot });
      expect(args).toContain('--diff-filter=A');
      return Promise.resolve({ stdout: gitLog, stderr: '' });
    });

    const { getRecentlyAddedRecipes } = await import('./recipes');
    const recipes = await getRecentlyAddedRecipes();

    expect(recipes.map((recipe) => recipe.name)).toEqual(['Snake Eyes', 'Belmont Jewel']);
  });

  it('uses GitHub commit data when local git history is shallow', async () => {
    const repoRoot = process.cwd();
    const fetchMock = vi.fn(async (url: URL | string) => {
      const requestUrl = new URL(String(url));

      if (requestUrl.pathname === '/repos/SBoudrias/cocktails/commits') {
        expect(requestUrl.searchParams.get('path')).toBe('packages/data/data/recipes');
        expect(requestUrl.searchParams.get('sha')).toBe('test-sha');

        if (requestUrl.searchParams.get('page') === '2') {
          return Response.json([]);
        }

        return Response.json([
          {
            sha: 'newer',
            commit: { committer: { date: '2026-05-18T09:00:00Z' } },
          },
          {
            sha: 'older',
            commit: { committer: { date: '2026-05-16T13:10:12Z' } },
          },
        ]);
      }

      if (requestUrl.pathname === '/repos/SBoudrias/cocktails/commits/newer') {
        return Response.json({
          files: [
            {
              filename:
                'packages/data/data/recipes/youtube-channel/educated-barfly/snake-eyes.json',
              status: 'added',
            },
            {
              filename:
                'packages/data/data/recipes/youtube-channel/anders-erickson/belmont-jewel.json',
              status: 'added',
            },
          ],
        });
      }

      if (requestUrl.pathname === '/repos/SBoudrias/cocktails/commits/older') {
        return Response.json({
          files: [
            {
              filename:
                'packages/data/data/recipes/youtube-channel/educated-barfly/9th-wonder.json',
              status: 'added',
            },
          ],
        });
      }

      throw new Error(`Unexpected GitHub API URL: ${requestUrl.href}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('GITHUB_REPOSITORY', 'SBoudrias/cocktails');
    vi.stubEnv('GITHUB_SHA', 'test-sha');

    execFileMocks.promise.mockImplementation((command, args) => {
      expect(command).toBe('git');
      if (args.includes('--show-toplevel')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }
      if (args.includes('--is-shallow-repository')) {
        return Promise.resolve({ stdout: 'true\n', stderr: '' });
      }

      throw new Error(`Unexpected git args: ${args.join(' ')}`);
    });

    const { getRecentlyAddedRecipes } = await import('./recipes');
    const recipes = await getRecentlyAddedRecipes();

    expect(recipes.map((recipe) => recipe.name)).toEqual([
      'Snake Eyes',
      'Belmont Jewel',
      '9th Wonder',
    ]);
  });

  it('returns no recently added recipes when the shallow clone fallback fails', async () => {
    const repoRoot = process.cwd();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network unavailable');
      }),
    );
    vi.stubEnv('GITHUB_REPOSITORY', 'SBoudrias/cocktails');
    vi.stubEnv('GITHUB_SHA', 'test-sha');

    execFileMocks.promise.mockImplementation((command, args) => {
      expect(command).toBe('git');
      if (args.includes('--show-toplevel')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }
      if (args.includes('--is-shallow-repository')) {
        return Promise.resolve({ stdout: 'true\n', stderr: '' });
      }

      throw new Error(`Unexpected git args: ${args.join(' ')}`);
    });

    const { getRecentlyAddedRecipes } = await import('./recipes');
    await expect(getRecentlyAddedRecipes()).resolves.toEqual([]);
  });
});

describe('getRecipe', () => {
  it('loads authored recipe techniques from the plural array field', async () => {
    const { getRecipe } = await import('./recipes');

    const recipe = await getRecipe(
      { type: 'youtube-channel', slug: 'truffles-on-the-rocks' },
      'clarified-new-york-sour',
    );

    expect(recipe.techniques).toEqual([
      {
        technique: 'clarification',
        method: 'milk',
        milk_type: 'Whole milk',
        quantity: { amount: 5, unit: 'oz' },
      },
    ]);
  });
});

function mockRecipe(ingredients: RecipeIngredient[]): Recipe {
  return {
    name: 'Test Recipe',
    slug: 'test-recipe',
    preparation: 'shaken',
    served_on: 'up',
    glassware: 'coupe',
    source: {
      type: 'book',
      name: 'Test Source',
      slug: 'test-source',
      link: 'https://example.com',
      description: 'Test description',
      recipeAmount: 1,
    },
    attributions: [],
    refs: [],
    ingredients,
  };
}

function ingredient({
  name,
  type,
  quantity,
}: {
  name: string;
  type: IngredientType;
  quantity: RecipeIngredient['quantity'];
}): RecipeIngredient {
  return {
    name,
    slug: name.toLowerCase().replaceAll(' ', '-'),
    type,
    categories: [],
    refs: [],
    ingredients: [],
    quantity,
  };
}

function categoryIngredient({
  name,
  categoryType,
  quantity,
}: {
  name: string;
  categoryType: IngredientType;
  quantity: RecipeIngredient['quantity'];
}): RecipeIngredient {
  return {
    name,
    slug: name.toLowerCase().replaceAll(' ', '-'),
    type: 'category',
    categoryType,
    parents: [],
    refs: [],
    quantity,
  };
}

describe('isNonAlcoholicRecipe', () => {
  it('allows recipes with only non-alcoholic ingredients', async () => {
    const { isNonAlcoholicRecipe } = await import('./recipes');

    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Ginger beer',
            type: 'soda',
            quantity: { amount: 3, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(true);
  });

  it('allows bitters and tinctures when used as seasoning', async () => {
    const { isNonAlcoholicRecipe } = await import('./recipes');

    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Angostura bitters',
            type: 'bitter',
            quantity: { amount: 4, unit: 'dash' },
          }),
          categoryIngredient({
            name: 'Orange bitters',
            categoryType: 'bitter',
            quantity: { amount: 3, unit: 'drop' },
          }),
          ingredient({
            name: 'Spicy tincture',
            type: 'tincture',
            quantity: { amount: 2, unit: 'dash' },
          }),
          categoryIngredient({
            name: 'Coffee tincture',
            categoryType: 'tincture',
            quantity: { amount: 2, unit: 'drop' },
          }),
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(true);
  });

  it('rejects recipes that use bitters as a base', async () => {
    const { isNonAlcoholicRecipe } = await import('./recipes');

    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Angostura bitters',
            type: 'bitter',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Lemon juice',
            type: 'juice',
            quantity: { amount: 0.75, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });

  it('rejects recipes that use tincture as a base', async () => {
    const { isNonAlcoholicRecipe } = await import('./recipes');

    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Hellfire tincture',
            type: 'tincture',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 0.75, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });

  it('rejects recipes with alcoholic ingredients or categories', async () => {
    const { isNonAlcoholicRecipe } = await import('./recipes');

    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Gin',
            type: 'spirit',
            quantity: { amount: 2, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          categoryIngredient({
            name: 'London Dry Gin',
            categoryType: 'spirit',
            quantity: { amount: 2, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });
});
