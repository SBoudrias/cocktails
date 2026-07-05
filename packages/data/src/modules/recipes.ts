import { execFile as execFileCb } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);
import { tryConvertVolume } from '@cocktails/conversion';
import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import uniqBy from 'lodash/uniqBy';
import { match } from 'ts-pattern';
import type { Category } from '../types/Category.ts';
import type { IngredientType, RecipeIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Source } from '../types/Source.ts';
import { getCategory, getChildCategories } from './categories';
import { isChapterFolder, parseChapterFolder } from './chapters';
import { RECIPE_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getIngredient } from './ingredients';
import { getSource } from './sources';

function toAlphaSort<I extends { name: string }>(arr: I[]) {
  return arr.toSorted((a, b) => a.name.localeCompare(b.name));
}

const maxNonAlcoholicFlavoringOunces = 0.25;

function isSmallAlcoholicFlavoringPour(ingredient: RecipeIngredient) {
  const ounces = tryConvertVolume(ingredient.quantity, 'oz')?.amount;
  return ounces != null && ounces <= maxNonAlcoholicFlavoringOunces;
}

function isAlcoholicIngredientType(type: IngredientType | 'category' | undefined) {
  return match(type)
    .with('beer', 'liqueur', 'spirit', 'wine', () => true)
    .otherwise(() => false);
}

function isAlcoholicIngredient(ingredient: RecipeIngredient) {
  return match(ingredient)
    .when(
      ({ type }) => isAlcoholicIngredientType(type),
      () => true,
    )
    .with({ type: 'bitter' }, (bitter) => !isSmallAlcoholicFlavoringPour(bitter))
    .with({ type: 'tincture' }, (tincture) => {
      return !isSmallAlcoholicFlavoringPour(tincture);
    })
    .with({ type: 'category' }, (category) => {
      return match(category.categoryType)
        .with('bitter', 'tincture', () => !isSmallAlcoholicFlavoringPour(category))
        .when(isAlcoholicIngredientType, () => true)
        .otherwise(() => false);
    })
    .otherwise(() => false);
}

export function isNonAlcoholicRecipe(recipe: Recipe) {
  return !recipe.ingredients.some(isAlcoholicIngredient);
}

type RecipeData = Omit<Recipe, 'chapter' | 'slug' | 'source'>;

type RecentRecipeEntry = {
  sourceType: Source['type'];
  sourceSlug: string;
  recipeSlug: string;
  chapter?: string;
  date: Date;
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
  date: Date,
): RecentRecipeEntry | null {
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

function getGitHubCommitDate(commit: unknown): Date | null {
  const commitData = getObjectProperty(commit, 'commit');
  const committer = getObjectProperty(commitData, 'committer');
  const date = getStringProperty(committer, 'date');
  if (!date) return null;

  return new Date(date);
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
  let currentDate: Date | null = null;

  for (const raw of gitLog.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('COMMIT ')) {
      currentDate = new Date(line.slice(7));
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

    // If no chapter provided, try flat path first, then search chapter directories
    if (!chapter) {
      const data = await readJSONFile<RecipeData>(directPath);
      if (!data) {
        // Search in chapter directories using glob
        const sourcePath = path.join(RECIPE_ROOT, source.type, source.slug);
        const matches = await fs.glob(`*/${recipe}.json`, { cwd: sourcePath });
        const matchArray = await Array.fromAsync(matches);

        const matchedPath = matchArray[0];
        if (matchedPath) {
          resolvedChapter = path.dirname(matchedPath);
          filepath = path.join(sourcePath, matchedPath);
        }
      }
    }

    const data = await readJSONFile<RecipeData>(filepath);

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
  (source, recipe, chapter) => `${source.type}/${source.slug}/${chapter ?? ''}/${recipe}`,
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
      const entries = await fs.readdir(sourcePath);
      const results: {
        sourceType: Source['type'];
        sourceSlug: string;
        recipeSlug: string;
        chapter?: string;
      }[] = [];

      for (const entry of entries) {
        if (entry === '_source.json') continue;

        const entryPath = path.join(sourcePath, entry);
        const stat = await fs.stat(entryPath);

        if (stat.isDirectory() && isChapterFolder(entry)) {
          // Chapter directory - traverse recipes inside
          const chapterFiles = await fs.readdir(entryPath);
          for (const recipeFilename of chapterFiles) {
            if (!recipeFilename.endsWith('.json')) continue;
            results.push({
              sourceType: sourceType as Source['type'],
              sourceSlug,
              recipeSlug: path.basename(recipeFilename, '.json'),
              chapter: entry,
            });
          }
        } else if (entry.endsWith('.json')) {
          // Flat recipe file
          results.push({
            sourceType: sourceType as Source['type'],
            sourceSlug,
            recipeSlug: path.basename(entry, '.json'),
          });
        }
      }

      return results;
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

export const getRecipesPerSource = memo(
  async (): Promise<{
    [sourceType: string]: { [sourceSlug: string]: Recipe[] | undefined };
  }> => {
    const recipes = await getAllRecipes();

    const bySourceType = Object.groupBy(recipes, (recipe) => recipe.source.type);
    return Object.fromEntries(
      Object.entries(bySourceType).map(([type, recipes]) => {
        return [type, Object.groupBy(recipes, (recipe) => recipe.source.slug)];
      }),
    );
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

export const getRecentlyAddedRecipes = memo(async (): Promise<Recipe[]> => {
  const { repoRoot, recipeRelPath } = await resolveGitRecipeContext();
  const recent = (await hasFullGitHistory(repoRoot))
    ? await getRecentlyAddedRecipesFromGit({ repoRoot, recipeRelPath })
    : await getRecentlyAddedRecipesFromGitHub(recipeRelPath);

  const recipes: Recipe[] = [];

  for (const { sourceType, sourceSlug, recipeSlug, chapter } of recent.toSorted(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )) {
    try {
      recipes.push(
        await getRecipe({ type: sourceType, slug: sourceSlug }, recipeSlug, chapter),
      );
    } catch (error) {
      if (!isMissingRecipeError(error)) throw error;
    }

    if (recipes.length >= recentlyAddedRecipeLimit) break;
  }

  return recipes;
});

export const getNonAlcoholicRecipes = memo(async (): Promise<Recipe[]> => {
  const recipes = await getAllRecipes();
  return toAlphaSort(recipes.filter(isNonAlcoholicRecipe));
});

export const getRecipeByCategory = memo(
  async (category: Category): Promise<Recipe[]> => {
    const recipes = await getAllRecipes();
    const childCategories = await getChildCategories(category);
    const categorySlugs = [category.slug, ...childCategories.map((c) => c.slug)];

    const relatedRecipes = recipes.filter((recipe) => {
      return recipe.ingredients.some((ingredient) => {
        if (ingredient.type === 'category') {
          return ingredient.slug === category.slug;
        }
        return ingredient.categories.some((c) => categorySlugs.includes(c.slug));
      });
    });

    return toAlphaSort(uniqBy(relatedRecipes, 'slug'));
  },
  (category) => category.slug,
);
