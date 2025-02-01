import path from 'node:path';
import fs from 'node:fs/promises';
import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import uniqBy from 'lodash/uniqBy';
import { RootIngredient } from '@/types/Ingredient';
import { INGREDIENT_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getCategoriesPerParent, getCategory } from './categories';
import { Ref } from '@/types/Ref';
import { Category } from '@/types/Category';
import { match } from 'ts-pattern';

export const getIngredient = memo(
  async (type: string, slug: string): Promise<RootIngredient> => {
    const filepath = path.join(INGREDIENT_ROOT, type, `${slug}.json`);
    const data = await readJSONFile<
      Omit<RootIngredient, 'slug' | 'categories'> & {
        categories?: string[];
        refs?: Ref[];
      }
    >(filepath);

    if (!data) throw new Error(`Ingredient not found: ${filepath}`);

    const categories = await Promise.all(
      (data.categories ?? []).map((category) => getCategory(slugify(category))),
    );
    const ingredients = await Promise.all(
      (data.ingredients ?? []).map(async (ingredient) => {
        const ingredientData = await match(ingredient)
          .with({ type: 'category' }, ({ name }) => getCategory(slugify(name)))
          .otherwise(({ type, name }) => getIngredient(type, slugify(name)));

        return {
          ...ingredient,
          ...ingredientData,
        };
      }),
    );

    const ingredient = {
      ...data,
      slug,
      categories,
      refs: data.refs ?? [],
      ingredients,
    };

    return ingredient;
  },
  (...args) => args.join('/'),
);

export const getAllIngredients = memo(async (): Promise<RootIngredient[]> => {
  const ingredients: RootIngredient[] = [];

  for await (const type of await fs.readdir(INGREDIENT_ROOT)) {
    for await (const file of await fs.readdir(path.join(INGREDIENT_ROOT, type))) {
      const ingredient = await getIngredient(type, path.basename(file, '.json'));
      ingredients.push(ingredient);
    }
  }

  return ingredients;
});

export const getIngredientPerCategories = memo(
  async (): Promise<Record<string, RootIngredient[]>> => {
    const ingredientsByCategoriesMap: Record<string, RootIngredient[]> = {};

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

export const getIngredientsForCategory = async (
  category: Category,
): Promise<[RootIngredient[], RootIngredient[]]> => {
  const ingredientsByCategories = await getIngredientPerCategories();
  const categoriesByParent = await getCategoriesPerParent();

  // Expand the category into its children
  const members = [category, ...(categoriesByParent[category.slug] ?? [])].flatMap(
    ({ slug }) => ingredientsByCategories[slug] ?? [],
  );

  // Expand the parent categories into their children
  const substitutes = category.parents
    .flatMap((parent) => [parent, ...(categoriesByParent[parent.slug] ?? [])])
    .flatMap((parent) => ingredientsByCategories[parent.slug] ?? []);

  return [uniqBy(members, 'slug'), uniqBy(substitutes, 'slug')];
};

export const getSubstitutesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<RootIngredient[]> => {
    const ingredientsByCategories = await getIngredientPerCategories();

    const substitutions = ingredient.categories
      .flatMap(({ slug }) => {
        return ingredientsByCategories[slug] ?? [];
      })
      .filter(({ slug }) => slug !== ingredient.slug);

    return uniqBy(substitutions, 'slug');
  },
  (ingredient) => ingredient.slug,
);
