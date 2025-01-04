import fs from 'node:fs/promises';
import path from 'node:path';
import { SourceType } from '@/types/Source';
import { INGREDIENT_ROOT, RECIPE_ROOT } from './constants';

export async function getRecipePageParams(): Promise<
  {
    type: SourceType;
    source: string;
    recipe: string;
  }[]
> {
  const params = [];

  for await (const type of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, type))) {
      for await (const dataFilePath of await fs.readdir(
        path.join(RECIPE_ROOT, type, sourceSlug),
      )) {
        if (dataFilePath === '_source.json') continue;

        const recipeSlug = path.basename(dataFilePath, '.json');
        params.push({
          type: type as SourceType,
          source: sourceSlug,
          recipe: recipeSlug,
        });
      }
    }
  }

  return params;
}

export async function getIngredientPageParams(): Promise<
  { type: string; name: string }[]
> {
  const params = [];

  for await (const type of await fs.readdir(INGREDIENT_ROOT)) {
    for await (const dataFilePath of await fs.readdir(path.join(INGREDIENT_ROOT, type))) {
      const ingredientSlug = path.basename(dataFilePath, '.json');
      params.push({
        type: type as SourceType,
        name: ingredientSlug,
      });
    }
  }

  return params;
}

export async function getSourcePageParams(): Promise<{ type: string; name: string }[]> {
  const params = [];

  for await (const type of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, type))) {
      params.push({
        type: type as SourceType,
        name: sourceSlug,
      });
    }
  }

  return params;
}
