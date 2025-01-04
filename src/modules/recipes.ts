import path from 'node:path';
import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import { readJSONFile } from './fs';
import { RECIPE_ROOT } from './constants';
import { getIngredient } from './ingredients';
import { getCategory } from './categories';
import { getSource } from './sources';
import { match } from 'ts-pattern';

export const getRecipe = memo(
  async (
    source: {
      type: Source['type'];
      slug: string;
    },
    recipe: string,
  ): Promise<Recipe> => {
    const filepath = path.join(RECIPE_ROOT, source.type, source.slug, `${recipe}.json`);
    const data = await readJSONFile<Omit<Recipe, 'source' | 'slug'>>(filepath);

    if (!data) throw new Error(`Recipe not found: ${filepath}`);

    const sourceData = await getSource(source.type, source.slug);

    return {
      ...data,
      slug: recipe,
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
);

export const getAllRecipes = memo(async (): Promise<Recipe[]> => {
  const ingredients: Promise<Recipe>[] = [];

  for await (const sourceType of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, sourceType))) {
      for await (const recipeFilename of await fs.readdir(
        path.join(RECIPE_ROOT, sourceType, sourceSlug),
      )) {
        if (recipeFilename === '_source.json') continue;
        const recipeSlug = path.basename(recipeFilename, '.json');

        ingredients.push(
          getRecipe({ type: sourceType as Source['type'], slug: sourceSlug }, recipeSlug),
        );
      }
    }
  }

  return await Promise.all(ingredients);
});

export const getRecipesPerSource = async (): Promise<{
  [sourceType: string]: { [sourceSlug: string]: Recipe[] | undefined };
}> => {
  const recipes = await getAllRecipes();

  const bySourceType = Object.groupBy(recipes, (recipe) => recipe.source.type);
  return Object.fromEntries(
    Object.entries(bySourceType).map(([type, recipes]) => {
      return [type, Object.groupBy(recipes, (recipe) => recipe.source.slug)];
    }),
  );
};

export const getRecipesFromSource = memo(
  async (source: Pick<Source, 'slug' | 'type'>): Promise<Recipe[]> => {
    const recipesPerSource = await getRecipesPerSource();
    return recipesPerSource[source.type]?.[source.slug] ?? [];
  },
);
