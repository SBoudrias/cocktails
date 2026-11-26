import { execFile as execFileCb } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);
import slugify from '@sindresorhus/slugify';
import uniqBy from 'lodash/uniqBy';
import { match } from 'ts-pattern';
import type { Category } from '../types/Category.ts';
import type { Author, Bar } from '../types/Entity.ts';
import type { RecipeIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Source } from '../types/Source.ts';
import { getCategory, getChildCategories } from './categories';
import { isChapterFolder, parseChapterFolder } from './chapters';
import { RECIPE_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getIngredient } from './ingredients';
import memo from './memo';
import { getSource } from './sources';

function toAlphaSort<I extends { name: string }>(arr: I[]) {
  return arr.toSorted((a, b) => a.name.localeCompare(b.name));
}

type RecipeData = Omit<Recipe, 'chapter' | 'slug' | 'source'>;

type RecentRecipeEntry = {
  sourceType: Source['type'];
  sourceSlug: string;
  recipeSlug: string;
  chapter?: string;
  date: Date;
  /** Calendar day (YYYY-MM-DD) of the commit, in the committer's own timezone. */
  day: string;
};

const recentlyAddedRecipeLimit = 30;
const githubApiMaxPages = 3;

function isSourceType(sourceType: string | undefined): sourceType is Source['type'] {
  return (
    sourceType === 'book' || sourceType === 'youtube-channel' || sourceType === 'podcast'
  );
}

function parseRecentRecipePath(
  recipeRelPath: string,
  filename: string,
  commitDate: string,
): RecentRecipeEntry | null {
  const date = new Date(commitDate);
  const day = commitDate.slice(0, 10);
  if (!filename.startsWith(`${recipeRelPath}/`)) return null;
  if (!filename.endsWith('.json') || filename.includes('_source.json')) return null;

  const parts = filename.slice(recipeRelPath.length + 1).split('/');
  const sourceType = parts[0];
  const sourceSlug = parts[1];

  if (!isSourceType(sourceType) || !sourceSlug) return null;

  if (parts.length === 3) {
    const recipeFilename = parts[2];
    if (!recipeFilename) return null;

    return {
      sourceType,
      sourceSlug,
      recipeSlug: path.basename(recipeFilename, '.json'),
      date,
      day,
    };
  }

  if (parts.length === 4) {
    const chapter = parts[2];
    const recipeFilename = parts[3];
    if (!chapter || !recipeFilename) return null;

    return {
      sourceType,
      sourceSlug,
      recipeSlug: path.basename(recipeFilename, '.json'),
      chapter,
      date,
      day,
    };
  }

  return null;
}

function getRecentRecipeKey(entry: RecentRecipeEntry): string {
  return `${entry.sourceType}/${entry.sourceSlug}/${entry.chapter ?? ''}/${entry.recipeSlug}`;
}

async function resolveGitRecipeContext(): Promise<{
  repoRoot: string;
  recipeRelPath: string;
}> {
  const { stdout: repoRootRaw } = await execFile(
    'git',
    ['rev-parse', '--show-toplevel'],
    {
      cwd: RECIPE_ROOT,
    },
  );
  const repoRoot = repoRootRaw.trim();

  return {
    repoRoot,
    recipeRelPath: path.relative(repoRoot, RECIPE_ROOT),
  };
}

async function hasFullGitHistory(repoRoot: string): Promise<boolean> {
  const { stdout } = await execFile('git', ['rev-parse', '--is-shallow-repository'], {
    cwd: repoRoot,
  });

  return stdout.trim() !== 'true';
}

function getGitHubRepository(): { owner: string; repo: string } | null {
  const [owner, repo, extra] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  if (!owner || !repo || extra) return null;

  return { owner, repo };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  return true;
}

function getObjectProperty(value: unknown, key: string): unknown {
  if (!isRecord(value)) return undefined;
  return value[key];
}

function getStringProperty(value: unknown, key: string): string | undefined {
  const property = getObjectProperty(value, key);
  return typeof property === 'string' ? property : undefined;
}

async function fetchGitHubJson(url: URL): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  return response.json();
}

function getGitHubCommitDate(commit: unknown): string | null {
  const commitData = getObjectProperty(commit, 'commit');
  const committer = getObjectProperty(commitData, 'committer');
  const date = getStringProperty(committer, 'date');
  return date ?? null;
}

async function getRecentlyAddedRecipesFromGit({
  repoRoot,
  recipeRelPath,
}: {
  repoRoot: string;
  recipeRelPath: string;
}): Promise<RecentRecipeEntry[]> {
  // --diff-filter=A: only commits that first introduced each file.
  const { stdout: gitLog } = await execFile(
    'git',
    [
      '-c',
      'core.quotePath=false',
      'log',
      '--diff-filter=A',
      '--name-only',
      '--format=COMMIT %cI',
      '--',
      recipeRelPath,
    ],
    { cwd: repoRoot },
  );

  const recent: RecentRecipeEntry[] = [];
  const seen = new Set<string>();
  let currentDate: string | null = null;

  for (const raw of gitLog.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('COMMIT ')) {
      currentDate = line.slice(7);
    } else if (currentDate) {
      const entry = parseRecentRecipePath(recipeRelPath, line, currentDate);
      if (!entry) continue;

      const key = getRecentRecipeKey(entry);
      if (!seen.has(key)) {
        seen.add(key);
        recent.push(entry);
      }
    }
  }

  return recent;
}

async function getRecentlyAddedRecipesFromGitHub(
  recipeRelPath: string,
): Promise<RecentRecipeEntry[]> {
  const repository = getGitHubRepository();
  if (!repository) return [];

  const apiRoot = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const recent: RecentRecipeEntry[] = [];
  const seen = new Set<string>();

  try {
    for (let page = 1; page <= githubApiMaxPages; page++) {
      if (recent.length >= recentlyAddedRecipeLimit) break;

      const commitsUrl = new URL(
        `/repos/${repository.owner}/${repository.repo}/commits`,
        apiRoot,
      );
      commitsUrl.searchParams.set('path', recipeRelPath);
      commitsUrl.searchParams.set('per_page', '100');
      commitsUrl.searchParams.set('page', String(page));
      if (process.env.GITHUB_SHA) {
        commitsUrl.searchParams.set('sha', process.env.GITHUB_SHA);
      }

      const commits = await fetchGitHubJson(commitsUrl);
      if (!Array.isArray(commits) || commits.length === 0) break;

      for (const commit of commits) {
        if (recent.length >= recentlyAddedRecipeLimit) break;

        const sha = getStringProperty(commit, 'sha');
        const date = getGitHubCommitDate(commit);
        if (!sha || !date) continue;

        const commitUrl = new URL(
          `/repos/${repository.owner}/${repository.repo}/commits/${sha}`,
          apiRoot,
        );
        const commitDetails = await fetchGitHubJson(commitUrl);
        const files = getObjectProperty(commitDetails, 'files');
        if (!Array.isArray(files)) continue;

        for (const file of files) {
          if (getStringProperty(file, 'status') !== 'added') continue;

          const filename = getStringProperty(file, 'filename');
          if (!filename) continue;

          const entry = parseRecentRecipePath(recipeRelPath, filename, date);
          if (!entry) continue;

          const key = getRecentRecipeKey(entry);
          if (!seen.has(key)) {
            seen.add(key);
            recent.push(entry);
          }

          if (recent.length >= recentlyAddedRecipeLimit) break;
        }
      }
    }
  } catch {
    return [];
  }

  return recent;
}

export const getRecipe = memo(
  async (
    source: {
      type: Source['type'];
      slug: string;
    },
    recipe: string,
    chapter?: string,
  ): Promise<Recipe> => {
    // Try direct path first (flat structure or known chapter)
    const directPath = chapter
      ? path.join(RECIPE_ROOT, source.type, source.slug, chapter, `${recipe}.json`)
      : path.join(RECIPE_ROOT, source.type, source.slug, `${recipe}.json`);

    let filepath = directPath;
    let resolvedChapter = chapter;
    let data = await readJSONFile<RecipeData>(directPath);

    // If no chapter provided and flat path missed, search chapter directories
    if (!chapter && !data) {
      const sourcePath = path.join(RECIPE_ROOT, source.type, source.slug);
      const matches = fs.glob(`*/${recipe}.json`, { cwd: sourcePath });
      const matchArray = await Array.fromAsync(matches);

      const matchedPath = matchArray[0];
      if (matchedPath) {
        resolvedChapter = path.dirname(matchedPath);
        filepath = path.join(sourcePath, matchedPath);
        data = await readJSONFile<RecipeData>(filepath);
      }
    }

    if (!data) throw new Error(`Recipe not found: ${filepath}`);

    const sourceData = await getSource(source.type, source.slug);

    return {
      ...data,
      slug: recipe,
      chapter: resolvedChapter
        ? (parseChapterFolder(resolvedChapter) ?? undefined)
        : undefined,
      refs: data.refs ?? [],
      attributions: data.attributions ?? [],
      ingredients: await Promise.all(
        data.ingredients.map(async (ingredient) => {
          const ingredientData = await match(ingredient)
            .with({ type: 'category' }, ({ name }) => getCategory(slugify(name)))
            .otherwise(({ type, name }) => getIngredient(type, slugify(name)));

          return {
            ...ingredientData,
            ...ingredient,
          };
        }),
      ),
      source: sourceData,
    };
  },
  (source, recipe, chapter = '') => `${source.type}/${source.slug}/${chapter}/${recipe}`,
);

export const getAllRecipes = memo(async (): Promise<Recipe[]> => {
  // Read all source types (book, youtube-channel, etc.)
  const sourceTypes = await fs.readdir(RECIPE_ROOT);

  // Read all source directories in parallel
  const sourceDirs = await Promise.all(
    sourceTypes.map(async (sourceType) => {
      const sourceSlugs = await fs.readdir(path.join(RECIPE_ROOT, sourceType));
      return sourceSlugs.map((sourceSlug) => ({ sourceType, sourceSlug }));
    }),
  );

  // Read all recipe files in parallel, handling chapter directories
  const recipeFiles = await Promise.all(
    sourceDirs.flat().map(async ({ sourceType, sourceSlug }) => {
      const sourcePath = path.join(RECIPE_ROOT, sourceType, sourceSlug);
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });
      const perEntry = await Promise.all(
        entries.map(async (entry) => {
          if (entry.name === '_source.json') return [];

          if (entry.isDirectory() && isChapterFolder(entry.name)) {
            const chapterFiles = await fs.readdir(path.join(sourcePath, entry.name));
            return chapterFiles
              .filter((recipeFilename) => recipeFilename.endsWith('.json'))
              .map((recipeFilename) => ({
                sourceType: sourceType as Source['type'],
                sourceSlug,
                recipeSlug: path.basename(recipeFilename, '.json'),
                chapter: entry.name,
              }));
          }
          if (entry.isFile() && entry.name.endsWith('.json')) {
            return [
              {
                sourceType: sourceType as Source['type'],
                sourceSlug,
                recipeSlug: path.basename(entry.name, '.json'),
                chapter: undefined,
              },
            ];
          }
          return [];
        }),
      );

      return perEntry.flat();
    }),
  );

  // Fetch all recipes in parallel
  const allRecipes = await Promise.all(
    recipeFiles
      .flat()
      .map(({ sourceType, sourceSlug, recipeSlug, chapter }) =>
        getRecipe({ type: sourceType, slug: sourceSlug }, recipeSlug, chapter),
      ),
  );

  return toAlphaSort(allRecipes);
});

function getRecipeChannelSlugs(recipe: Recipe): Set<string> {
  const slugs = new Set<string>();

  for (const ref of recipe.refs) {
    if (ref.type === 'youtube') slugs.add(ref.channel);
  }

  // The folder a recipe file lives in is its owning source.
  if (recipe.source.type === 'youtube-channel') slugs.add(recipe.source.slug);

  return slugs;
}

export const getRecipesPerSource = memo(
  async (): Promise<Record<string, Record<string, Recipe[] | undefined>>> => {
    const recipes = await getAllRecipes();

    // YouTube channel lists are dynamic: a recipe appears under every channel
    // that owns its file or that one of its youtube refs points to. This lets a
    // recipe presented by multiple channels show up on each channel's list
    // while keeping a single canonical recipe file.
    const youtubeChannelRecipes: Record<string, Recipe[]> = {};
    const bySourceType: Record<string, Recipe[]> = {};

    for (const recipe of recipes) {
      for (const slug of getRecipeChannelSlugs(recipe)) {
        (youtubeChannelRecipes[slug] ??= []).push(recipe);
      }

      if (recipe.source.type === 'youtube-channel') continue;
      (bySourceType[recipe.source.type] ??= []).push(recipe);
    }

    return {
      'youtube-channel': youtubeChannelRecipes,
      ...Object.fromEntries(
        Object.entries(bySourceType).map(([type, recipes]) => {
          return [type, Object.groupBy(recipes, (recipe) => recipe.source.slug)];
        }),
      ),
    };
  },
);

export const getRecipesFromSource = memo(
  async (source: Pick<Source, 'slug' | 'type'>): Promise<Recipe[]> => {
    const recipesPerSource = await getRecipesPerSource();
    return recipesPerSource[source.type]?.[source.slug] ?? [];
  },
);

function isMissingRecipeError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('Recipe not found: ');
}

/**
 * The most recently added recipes, newest first, with the calendar day
 * (YYYY-MM-DD) each was first committed. The date of a recipe is the commit
 * that first introduced its file path, so a recipe that is later edited keeps
 * its date. The list is cut off at a day boundary: once the limit is reached,
 * the rest of that day's recipes are still included so no day is split.
 */
export const getRecentlyAddedRecipeEntries = memo(
  async (): Promise<{ recipe: Recipe; day: string }[]> => {
    const { repoRoot, recipeRelPath } = await resolveGitRecipeContext();
    const recent = (await hasFullGitHistory(repoRoot))
      ? await getRecentlyAddedRecipesFromGit({ repoRoot, recipeRelPath })
      : await getRecentlyAddedRecipesFromGitHub(recipeRelPath);

    const entries: { recipe: Recipe; day: string }[] = [];

    for (const { sourceType, sourceSlug, recipeSlug, chapter, day } of recent.toSorted(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )) {
      if (entries.length >= recentlyAddedRecipeLimit && entries.at(-1)?.day !== day) {
        break;
      }

      try {
        entries.push({
          recipe: await getRecipe(
            { type: sourceType, slug: sourceSlug },
            recipeSlug,
            chapter,
          ),
          day,
        });
      } catch (error) {
        if (!isMissingRecipeError(error)) throw error;
      }
    }

    return entries;
  },
);

export const getRecentlyAddedRecipes = memo(async (): Promise<Recipe[]> => {
  const entries = await getRecentlyAddedRecipeEntries();
  return entries.map(({ recipe }) => recipe);
});

export const getMilkClarifiedRecipes = memo(async (): Promise<Recipe[]> => {
  const recipes = await getAllRecipes();
  return toAlphaSort(
    recipes.filter((recipe) =>
      recipe.techniques?.some(
        (technique) =>
          technique.technique === 'clarification' && technique.method === 'milk',
      ),
    ),
  );
});

/**
 * A technique's lines on an ingredient: the data allows one (`technique`) or
 * many (`technique`), and both spellings carry the same markers.
 */
const techniquesOf = (ingredient: RecipeIngredient) =>
  Array.isArray(ingredient.technique)
    ? ingredient.technique
    : ingredient.technique
      ? [ingredient.technique]
      : [];

/** A recipe that acid-adjusts one of its juices on the line — the technique
 * the acid-adjusting and super-juice calculators exist for. The marker is
 * authored on the ingredient (`acid-adjustment`), so the list stays true as
 * recipes are added. */
export const getAcidAdjustedRecipes = memo(async (): Promise<Recipe[]> => {
  const recipes = await getAllRecipes();
  return toAlphaSort(
    recipes.filter((recipe) =>
      recipe.ingredients.some((ingredient) =>
        techniquesOf(ingredient).some(
          (technique) => technique.technique === 'acid-adjustment',
        ),
      ),
    ),
  );
});

const getRecipeCategoryIndexes = memo(async () => {
  const recipes = await getAllRecipes();
  const directByCategory = new Map<string, number[]>();
  const bottleByCategory = new Map<string, number[]>();

  for (const [index, recipe] of recipes.entries()) {
    const directSlugs = new Set<string>();
    const bottleSlugs = new Set<string>();

    for (const ingredient of recipe.ingredients) {
      if (ingredient.type === 'category') {
        directSlugs.add(ingredient.slug);
      } else {
        for (const category of ingredient.categories) {
          bottleSlugs.add(category.slug);
        }
      }
    }

    for (const slug of directSlugs) {
      let list = directByCategory.get(slug);
      if (!list) {
        list = [];
        directByCategory.set(slug, list);
      }
      list.push(index);
    }

    for (const slug of bottleSlugs) {
      let list = bottleByCategory.get(slug);
      if (!list) {
        list = [];
        bottleByCategory.set(slug, list);
      }
      list.push(index);
    }
  }

  return { recipes, directByCategory, bottleByCategory };
});

export const getRecipeByCategory = memo(
  async (category: Category): Promise<Recipe[]> => {
    const [{ recipes, directByCategory, bottleByCategory }, childCategories] =
      await Promise.all([getRecipeCategoryIndexes(), getChildCategories(category)]);

    const matchedIndices = new Set<number>(directByCategory.get(category.slug) ?? []);
    for (const slug of [category.slug, ...childCategories.map((c) => c.slug)]) {
      for (const index of bottleByCategory.get(slug) ?? []) {
        matchedIndices.add(index);
      }
    }

    const relatedRecipes = [...matchedIndices]
      .toSorted((a, b) => a - b)
      .map((index) => recipes[index]!);

    return toAlphaSort(uniqBy(relatedRecipes, 'slug'));
  },
  (category) => category.slug,
);

const getRecipesByAuthorName = memo(async (): Promise<Map<string, Recipe[]>> => {
  const recipes = await getAllRecipes();
  const byAuthor = new Map<string, Recipe[]>();

  for (const recipe of recipes) {
    const credited = new Set<string>();
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        credited.add(attribution.source);
      }
    }

    for (const name of credited) {
      let list = byAuthor.get(name);
      if (!list) {
        list = [];
        byAuthor.set(name, list);
      }
      list.push(recipe);
    }
  }

  for (const [name, list] of byAuthor) {
    byAuthor.set(name, toAlphaSort(list));
  }

  return byAuthor;
});

export const getRecipesByAuthor = memo(
  async (author: Author): Promise<Recipe[]> => {
    const byAuthor = await getRecipesByAuthorName();
    return byAuthor.get(author.name) ?? [];
  },
  (author) => author.slug,
);

const barIndexKey = (name: string, location: string | undefined) =>
  location === undefined ? `${name}\u0000` : `${name}\u00001:${location}`;

const getRecipesByBarKey = memo(async (): Promise<Map<string, Recipe[]>> => {
  const recipes = await getAllRecipes();
  const byBar = new Map<string, Recipe[]>();

  for (const recipe of recipes) {
    const credited = new Set<string>();
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar') {
        credited.add(barIndexKey(attribution.source, attribution.location));
      }
    }

    for (const key of credited) {
      let list = byBar.get(key);
      if (!list) {
        list = [];
        byBar.set(key, list);
      }
      list.push(recipe);
    }
  }

  for (const [key, list] of byBar) {
    byBar.set(key, toAlphaSort(list));
  }

  return byBar;
});

export const getRecipesByBar = memo(
  async (bar: Bar): Promise<Recipe[]> => {
    const byBar = await getRecipesByBarKey();
    return byBar.get(barIndexKey(bar.name, bar.location)) ?? [];
  },
  (bar) => bar.slug,
);
