import fs from 'node:fs/promises';
import path from 'node:path';
import type { Source } from '@/types/Source';
import { isChapterFolder } from './chapters';
import { INGREDIENT_ROOT, RECIPE_ROOT } from './constants';

export async function getRecipePageParams(): Promise<
  {
    type: Source['type'];
    source: string;
    recipe: string;
  }[]
> {
  const params = [];

  for await (const type of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, type))) {
      const sourcePath = path.join(RECIPE_ROOT, type, sourceSlug);

      for await (const entry of await fs.readdir(sourcePath)) {
        if (entry === '_source.json') continue;

        const entryPath = path.join(sourcePath, entry);
        const stat = await fs.stat(entryPath);

        if (stat.isDirectory() && isChapterFolder(entry)) {
          // Chapter directory - traverse recipes inside
          for await (const recipeFilename of await fs.readdir(entryPath)) {
            if (!recipeFilename.endsWith('.json')) continue;
            const recipeSlug = path.basename(recipeFilename, '.json');
            params.push({
              type: type as Source['type'],
              source: sourceSlug,
              recipe: recipeSlug,
            });
          }
        } else if (entry.endsWith('.json')) {
          // Flat recipe file
          const recipeSlug = path.basename(entry, '.json');
          params.push({
            type: type as Source['type'],
            source: sourceSlug,
            recipe: recipeSlug,
          });
        }
      }
    }
  }

  return params;
}

export async function getIngredientPageParams(): Promise<
  { type: string; slug: string }[]
> {
  const params = [];

  for await (const type of await fs.readdir(INGREDIENT_ROOT)) {
    for await (const dataFilePath of await fs.readdir(path.join(INGREDIENT_ROOT, type))) {
      const ingredientSlug = path.basename(dataFilePath, '.json');
      params.push({
        type: type as Source['type'],
        slug: ingredientSlug,
      });
    }
  }

  return params;
}

export async function getSourcePageParams(): Promise<
  { type: Source['type']; name: string }[]
> {
  const params = [];

  for await (const type of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, type))) {
      params.push({
        type: type as Source['type'],
        name: sourceSlug,
      });
    }
  }

  return params;
}
