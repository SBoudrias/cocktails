import path from 'node:path';
import fs from 'node:fs/promises';
import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import uniqBy from 'lodash/uniqBy';
import { BaseIngredient } from '@/types/Ingredient';
import { INGREDIENT_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getCategory } from './categories';

export const getIngredient = memo(
  async (type: string, slug: string): Promise<BaseIngredient> => {
    const filepath = path.join(INGREDIENT_ROOT, type, `${slug}.json`);
    const data = await readJSONFile<
      Omit<BaseIngredient, 'slug' | 'categories'> & { categories?: string[] }
    >(filepath);

    if (!data) throw new Error(`Ingredient not found: ${filepath}`);

    const categories = await Promise.all(
      (data.categories ?? []).map((category) => getCategory(slugify(category))),
    );

    const ingredient = {
      ...data,
      slug,
      categories,
    };

    return ingredient;
  },
  (...args) => args.join('/'),
);

export const getAllIngredients = memo(async (): Promise<BaseIngredient[]> => {
  const ingredients: BaseIngredient[] = [];

  for await (const type of await fs.readdir(INGREDIENT_ROOT)) {
    for await (const file of await fs.readdir(path.join(INGREDIENT_ROOT, type))) {
      const ingredient = await getIngredient(type, path.basename(file, '.json'));
      ingredients.push(ingredient);
    }
  }

  return ingredients;
});

export const getIngredientPerCategories = memo(
  async (): Promise<Record<string, BaseIngredient[]>> => {
    const ingredientsByCategoriesMap: Record<string, BaseIngredient[]> = {};

    const ingredients = await getAllIngredients();
    ingredients.forEach((ingredient) => {
      ingredient.categories.forEach((category) => {
        const arr = ingredientsByCategoriesMap[category.slug] ?? [];
        arr.push(ingredient);

        ingredientsByCategoriesMap[category.slug] = arr;
      });
    });

    return Object.fromEntries(
      Object.entries(ingredientsByCategoriesMap).map(([key, value]) => [
        key,
        uniqBy(value, 'slug'),
      ]),
    );
  },
);

export const getSubstitutesForIngredient = memo(
  async (ingredient: BaseIngredient): Promise<BaseIngredient[]> => {
    const ingredientsByCategories = await getIngredientPerCategories();

    const preferredCategory = ingredient.categories[0];
    if (!preferredCategory) return [];

    const substitutions = (ingredientsByCategories[preferredCategory.slug] ?? []).filter(
      ({ slug }) => slug !== ingredient.slug,
    );
    return uniqBy(substitutions, 'slug');
  },
  (ingredient) => ingredient.slug,
);