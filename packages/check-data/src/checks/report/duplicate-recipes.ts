import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../../cli-util.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';

/** One recipe file, as the duplicate check reads it. */
export interface RecipeEntry {
  /** Path relative to the data package root, for messages. */
  file: string;
  name: string;
  attributions: ReadonlyArray<{ relation: string; source: string }>;
  ingredients: ReadonlyArray<{
    name: string;
    quantity?: { amount?: number; unit?: string; maximum?: number; modifier?: string };
  }>;
}

/** Lookup indexes that collapse specific bottles to their category. */
export interface CategoryIndex {
  /** Lowercase category names — a name in here is already generic. */
  categoryNamesLower: ReadonlySet<string>;
  /** Lowercase ingredient name → first (primary) category name, lowercased. */
  ingredientFirstCategory: ReadonlyMap<string, string>;
}

export interface DuplicateRecipePair {
  /** The shared recipe display name. */
  name: string;
  fileA: string;
  fileB: string;
  /** Attribution labels shared by both files, e.g. "recipe author: Jason Littrell". */
  sharedAttributions: string[];
}

function normalizeIngredientName(name: string, index: CategoryIndex): string {
  const lower = name.toLowerCase();
  if (index.categoryNamesLower.has(lower)) return lower;
  return index.ingredientFirstCategory.get(lower) ?? lower;
}

function specKey(recipe: RecipeEntry, index: CategoryIndex): string {
  return recipe.ingredients
    .map((ingredient) => {
      const quantity = ingredient.quantity ?? {};
      return [
        normalizeIngredientName(ingredient.name, index),
        String(quantity.amount ?? ''),
        quantity.unit ?? '',
        String(quantity.maximum ?? ''),
        quantity.modifier ?? '',
      ].join(':');
    })
    .toSorted((a, b) => a.localeCompare(b))
    .join('|');
}

/**
 * Find recipes transcribed twice across sources: same display name, at least
 * one shared attribution (same author or bar), and the same ingredient spec
 * once specific bottles are collapsed to their category. Two channels each
 * covering the same classic, or a book recipe a channel later presents, keep
 * separate files and differ in spec or attributions — those are not flagged.
 */
export function findDuplicateRecipePairs(
  recipes: ReadonlyArray<RecipeEntry>,
  index: CategoryIndex,
): DuplicateRecipePair[] {
  const byName = new Map<string, RecipeEntry[]>();
  for (const recipe of recipes) {
    const key = recipe.name.toLowerCase();
    const group = byName.get(key);
    if (group) group.push(recipe);
    else byName.set(key, [recipe]);
  }

  const pairs: DuplicateRecipePair[] = [];
  for (const group of byName.values()) {
    const specs = group.map((recipe) => specKey(recipe, index));
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (specs[i] !== specs[j]) continue;
        const shared = group[i]!.attributions.filter((a) =>
          group[j]!.attributions.some(
            (b) =>
              a.relation.toLowerCase() === b.relation.toLowerCase() &&
              a.source.toLowerCase() === b.source.toLowerCase(),
          ),
        );
        if (shared.length === 0) continue;
        pairs.push({
          name: group[i]!.name,
          fileA: group[i]!.file,
          fileB: group[j]!.file,
          sharedAttributions: shared.map((a) => `${a.relation}: ${a.source}`),
        });
      }
    }
  }
  return pairs;
}

async function loadCategoryIndex(): Promise<CategoryIndex> {
  const categoryNamesLower = new Set<string>();
  for await (const categoryFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/categories/*.json'),
  )) {
    const data: { name: string } = JSON.parse(await fs.readFile(categoryFile, 'utf-8'));
    categoryNamesLower.add(data.name.toLowerCase());
  }

  const ingredientFirstCategory = new Map<string, string>();
  for await (const ingredientFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/ingredients/**/*.json'),
  )) {
    const data: { name: string; categories?: string[] } = JSON.parse(
      await fs.readFile(ingredientFile, 'utf-8'),
    );
    const firstCategory = data.categories?.[0];
    if (firstCategory) {
      ingredientFirstCategory.set(data.name.toLowerCase(), firstCategory.toLowerCase());
    }
  }

  return { categoryNamesLower, ingredientFirstCategory };
}

/**
 * Warns about recipes transcribed twice across sources (e.g. a book recipe
 * re-entered as a youtube-channel file): two files that share a name, an
 * attribution, and an identical normalized ingredient spec.
 */
export async function reportDuplicateRecipes(): Promise<void> {
  logger.header('👯 Checking for duplicate recipes...');

  const index = await loadCategoryIndex();
  const recipes: RecipeEntry[] = [];
  for await (const recipeFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/recipes/**/*.json'),
  )) {
    if (path.basename(recipeFile) === '_source.json') continue;
    const data: RecipeEntry = JSON.parse(await fs.readFile(recipeFile, 'utf-8'));
    recipes.push({
      file: path.relative(PACKAGE_ROOT, recipeFile),
      name: data.name,
      attributions: data.attributions ?? [],
      ingredients: data.ingredients ?? [],
    });
  }

  for (const pair of findDuplicateRecipePairs(recipes, index)) {
    logger.warn(
      `Possible duplicate recipe "${pair.name}":`,
      `${pair.fileA} and ${pair.fileB} have the same ingredient spec and share ` +
        `${pair.sharedAttributions.join(', ')}.`,
      `Keep one canonical file and merge the other's refs into it.`,
    );
  }

  logger.footer('Done!');
}
