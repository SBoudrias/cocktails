import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import uniqBy from 'lodash/uniqBy';
import { match } from 'ts-pattern';
import type { Category } from '../types/Category.ts';
import type { RootIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import type { Ref } from '../types/Ref.ts';
import { getCategoriesPerParent, getCategory, getRelatedCategories } from './categories';
import { INGREDIENT_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';
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

/**
 * Every bottle that belongs to a category: the ones declaring it directly
 * plus the ones from its child categories, each once, alphabetically.
 */
export const getIngredientsForCategory = async (
  category: Category,
): Promise<RootIngredient[]> => {
  const ingredientsByCategories = await getIngredientPerCategories();
  const categoriesByParent = await getCategoriesPerParent();
  const bottleSlugs = new Set<string>();

  return [
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
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
};

type IngredientSubstitutions = {
  /**
   * The category the primary substitutions come from: the bottle's most
   * specific declared category (see `getSubstitutesForIngredient`).
   */
  category: Category;
  /** Bottles from that category, the bottle itself excluded. */
  substitutes: RootIngredient[];
  /** Categories sharing an ancestor with `category`, except the bottle's own. */
  relatedCategories: Category[];
};

/**
 * How deep a category sits in the category hierarchy: 0 for a root category,
 * one more than its deepest parent otherwise. Parents come fully resolved
 * from the category files, so this is a synchronous walk; a cycle in the
 * data would be clipped instead of looping forever.
 */
function getCategoryDepth(category: Category, ancestors = new Set<string>()): number {
  if (category.parents.length === 0 || ancestors.has(category.slug)) return 0;

  const includingSelf = new Set(ancestors).add(category.slug);

  return (
    Math.max(
      ...category.parents.map((parent) => getCategoryDepth(parent, includingSelf)),
    ) + 1
  );
}

/**
 * Substitution options for a bottle, as two lists:
 *
 * - The primary list holds only bottles from the bottle's most specific
 *   category — the deepest of its declared categories, ties broken by
 *   declaration order (e.g. for a Jamaican aged rum, only other bottles in
 *   Blended aged rum (Jamaica), not rums from other categories). A category
 *   holding no other bottle cannot supply substitutions, so the most specific
 *   category with members is chosen; a bottle alone in its tightest category
 *   falls back to a broader category it declares.
 * - The secondary list holds the related categories: the substitution-friendly
 *   neighbors of the chosen category in the category tree — its direct
 *   parents and its siblings (the other children of those parents), e.g. the
 *   other aged-rum categories for a Jamaican aged rum — minus the categories
 *   the bottle declares itself.
 *
 * Returns undefined when the bottle declares no category at all.
 */
export const getSubstitutesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<IngredientSubstitutions | undefined> => {
    if (ingredient.categories.length === 0) return undefined;

    const ingredientsByCategories = await getIngredientPerCategories();

    const rankedCategories = ingredient.categories
      .map((category, declaredOrder) => ({
        category,
        declaredOrder,
        depth: getCategoryDepth(category),
      }))
      .toSorted((a, b) => b.depth - a.depth || a.declaredOrder - b.declaredOrder);

    const [mostSpecific] = rankedCategories;
    if (mostSpecific === undefined) return undefined;

    // The primary list comes from the most specific category that holds at
    // least one other bottle.
    const substitutionCategory =
      rankedCategories.find(({ category }) =>
        (ingredientsByCategories[category.slug] ?? []).some(
          ({ slug }) => slug !== ingredient.slug,
        ),
      ) ?? mostSpecific;

    const substitutes = (
      ingredientsByCategories[substitutionCategory.category.slug] ?? []
    ).filter(({ slug }) => slug !== ingredient.slug);

    const declaredSlugs = new Set(ingredient.categories.map(({ slug }) => slug));
    const relatedCategories = (
      await getRelatedCategories(substitutionCategory.category)
    ).filter(({ slug }) => !declaredSlugs.has(slug));

    return {
      category: substitutionCategory.category,
      substitutes: toAlphaSort(substitutes),
      relatedCategories,
    };
  },
  (ingredient) => ingredient.slug,
);

export const getRecipesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<Recipe[]> => {
    const allRecipes = await getAllRecipes();
    const relatedRecipes = allRecipes.filter((recipe) => {
      const isDirectIngredient = recipe.ingredients.some(
        (recipeIngredient) => recipeIngredient.slug === ingredient.slug,
      );
      const isTechniqueMaterial = (recipe.techniques ?? []).some((technique) =>
        match(technique)
          .with(
            { technique: 'clarification', method: 'milk' },
            ({ milk_type: milkType }) => slugify(milkType) === ingredient.slug,
          )
          .exhaustive(),
      );

      return isDirectIngredient || isTechniqueMaterial;
    });

    return toAlphaSort(relatedRecipes);
  },
  (ingredient) => ingredient.slug,
);
