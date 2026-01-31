import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import uniqBy from 'lodash/uniqBy';
import fs from 'node:fs/promises';
import path from 'node:path';
import { match } from 'ts-pattern';
import type { Category } from '../types/Category.ts';
import type { RootIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Ref } from '../types/Ref.ts';
import { getCategoriesPerParent, getCategory } from './categories';
import { INGREDIENT_ROOT } from './constants';
import { readJSONFile } from './fs';
import { getAllRecipes } from './recipes';

function toAlphaSort<I extends { name: string }>(arr: I[]) {
  return arr.toSorted((a, b) => a.name.localeCompare(b.name));
}

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

  return toAlphaSort(ingredients);
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
        toAlphaSort(uniqBy(value, 'slug')),
      ]),
    );
  },
);

export const getIngredientsForCategory = async (
  category: Category,
): Promise<[RootIngredient[], RootIngredient[]]> => {
  const ingredientsByCategories = await getIngredientPerCategories();
  const categoriesByParent = await getCategoriesPerParent();
  const bottleSlugs = new Set<string>();

  // Members are all bottles from the main category and related child categories.
  const members = [
    // Main category
    category,
    // Child categories
    ...(categoriesByParent[category.slug] ?? []),
  ]
    .flatMap((category) => ingredientsByCategories[category.slug] ?? [])
    .filter(({ slug }) => {
      const isUnique = !bottleSlugs.has(slug);
      bottleSlugs.add(slug);
      return isUnique;
    });

  // Add ingredients from the parent categories.
  const substitutes: RootIngredient[] = category.parents
    .flatMap((parent) => ingredientsByCategories[parent.slug] ?? [])
    .filter(({ slug }) => {
      const isUnique = !bottleSlugs.has(slug);
      bottleSlugs.add(slug);
      return isUnique;
    });

  if (substitutes.length < 5) {
    const siblingCategories = category.parents.flatMap(
      (parent) => categoriesByParent[parent.slug] ?? [],
    );

    for (const category of siblingCategories) {
      if (substitutes.length >= 5) break;

      const categoryMembers = ingredientsByCategories[category.slug] ?? [];
      for (const bottle of categoryMembers) {
        if (substitutes.length >= 5) break;

        if (!bottleSlugs.has(bottle.slug)) {
          substitutes.push(bottle);
        }
        bottleSlugs.add(bottle.slug);
      }
    }
  }

  return [toAlphaSort(members), toAlphaSort(substitutes)];
};

export const getSubstitutesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<RootIngredient[]> => {
    const ingredientsByCategories = await getIngredientPerCategories();

    const substitutions = ingredient.categories
      .flatMap(({ slug }) => {
        return ingredientsByCategories[slug] ?? [];
      })
      .filter(({ slug }) => slug !== ingredient.slug);

    return toAlphaSort(uniqBy(substitutions, 'slug'));
  },
  (ingredient) => ingredient.slug,
);

export const getRecipesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<Recipe[]> => {
    const allRecipes = await getAllRecipes();
    const relatedRecipes = allRecipes.filter((recipe) =>
      recipe.ingredients.some((i) => i.slug === ingredient.slug),
    );

    return toAlphaSort(relatedRecipes);
  },
  (ingredient) => ingredient.slug,
);
