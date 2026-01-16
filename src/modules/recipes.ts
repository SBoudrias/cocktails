import slugify from '@sindresorhus/slugify';
import { uniqBy } from 'lodash';
import memo from 'lodash/memoize';
import fs from 'node:fs/promises';
import path from 'node:path';
import { match } from 'ts-pattern';
import type { Category } from '@/types/Category';
import type { Recipe } from '@/types/Recipe';
import type { Source } from '@/types/Source';
import { getCategory, getChildCategories } from './categories';
import { isChapterFolder } from './chapters';
import { RECIPE_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getIngredient } from './ingredients';
import { getSource } from './sources';

function toAlphaSort<I extends { name: string }>(arr: I[]) {
  return arr.toSorted((a, b) => a.name.localeCompare(b.name));
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
      const data = await readJSONFile<Omit<Recipe, 'source' | 'slug'>>(directPath);
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

    const data = await readJSONFile<Omit<Recipe, 'source' | 'slug' | 'chapter'>>(filepath);

    if (!data) throw new Error(`Recipe not found: ${filepath}`);

    const sourceData = await getSource(source.type, source.slug);

    return {
      ...data,
      slug: recipe,
      chapter: resolvedChapter,
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
  const recipes: Promise<Recipe>[] = [];

  for await (const sourceType of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, sourceType))) {
      const sourcePath = path.join(RECIPE_ROOT, sourceType, sourceSlug);

      for await (const entry of await fs.readdir(sourcePath)) {
        if (entry === '_source.json') continue;

        const entryPath = path.join(sourcePath, entry);
        const stat = await fs.stat(entryPath);

        if (stat.isDirectory() && isChapterFolder(entry)) {
          // Chapter directory - traverse recipes inside
          for await (const recipeFilename of await fs.readdir(entryPath)) {
            if (!recipeFilename.endsWith('.json')) continue;
            const recipeSlug = path.basename(recipeFilename, '.json');

            recipes.push(
              getRecipe(
                { type: sourceType as Source['type'], slug: sourceSlug },
                recipeSlug,
                entry,
              ),
            );
          }
        } else if (entry.endsWith('.json')) {
          // Flat recipe file
          const recipeSlug = path.basename(entry, '.json');

          recipes.push(
            getRecipe({ type: sourceType as Source['type'], slug: sourceSlug }, recipeSlug),
          );
        }
      }
    }
  }

  const allRecipes = await Promise.all(recipes);
  return toAlphaSort(allRecipes);
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
