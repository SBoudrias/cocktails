import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('reports the committer-local day each recipe was first added', async () => {
    const repoRoot = process.cwd();
    const gitLog = [
      'COMMIT 2026-05-18T23:30:00-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/snake-eyes.json',
      'COMMIT 2026-05-16T13:10:12-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/9th-wonder.json',
    ].join('\n');

    execFileMocks.promise.mockImplementation((command, args) => {
      if (args.includes('--show-toplevel')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }
      if (args.includes('--is-shallow-repository')) {
        return Promise.resolve({ stdout: 'false\n', stderr: '' });
      }
      return Promise.resolve({ stdout: gitLog, stderr: '' });
    });

    const { getRecentlyAddedRecipeEntries } = await import('./recipes');
    const entries = await getRecentlyAddedRecipeEntries();

    expect(entries.map(({ recipe, day }) => [recipe.name, day])).toEqual([
      ['Snake Eyes', '2026-05-18'],
      ['9th Wonder', '2026-05-16'],
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

describe('getRecipesFromSource', () => {
  it('lists a recipe under every channel its refs point to', async () => {
    const { getRecipesFromSource } = await import('./recipes');

    // `make-and-drink/demerara-dry-float` is owned by Make and Drink but
    // references a Spike video, so it must appear on both channel lists.
    const makeAndDrink = await getRecipesFromSource({
      type: 'youtube-channel',
      slug: 'make-and-drink',
    });
    const spike = await getRecipesFromSource({
      type: 'youtube-channel',
      slug: 'spike-breezeway-cocktail-hour',
    });

    expect(makeAndDrink.map((recipe) => recipe.slug)).toContain('demerara-dry-float');
    expect(spike.map((recipe) => recipe.slug)).toContain('demerara-dry-float');
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

describe('getMilkClarifiedRecipes', () => {
  it('lists the recipes that mark milk clarification, alphabetically', async () => {
    const { getMilkClarifiedRecipes } = await import('./recipes');

    const recipes = await getMilkClarifiedRecipes();
    const names = recipes.map(({ name }) => name);

    expect(names).toContain('Clarified New York Sour');
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b)));
  });
});

describe('getAcidAdjustedRecipes', () => {
  it('lists recipes that acid-adjust an ingredient, not every tart recipe', async () => {
    const { getAcidAdjustedRecipes } = await import('./recipes');

    const recipes = await getAcidAdjustedRecipes();
    const slugs = recipes.map(({ slug }) => slug);

    // Fu Manjito acid-adjusts its lime juice on the line.
    expect(slugs).toContain('fu-manjito');
    // The plain Daiquiri is lime and sugar, but never acid-adjusted.
    expect(slugs).not.toContain('daiquiri');
  });
});
