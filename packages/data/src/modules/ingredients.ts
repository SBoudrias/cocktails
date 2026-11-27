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

/**
 * Most-referenced bottle first (the common bottles lead as recommendations),
 * ties broken alphabetically so the order is stable.
 */
function byRecipeCountThenName(recipeCounts: Map<string, number>) {
  return (a: { name: string; slug: string }, b: { name: string; slug: string }) =>
    (recipeCounts.get(b.slug) ?? 0) - (recipeCounts.get(a.slug) ?? 0) ||
    a.name.localeCompare(b.name);
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
  const types = await fs.readdir(INGREDIENT_ROOT);
  const entries = await Promise.all(
    types.map(async (type) => {
      const files = await fs.readdir(path.join(INGREDIENT_ROOT, type));
      return files.map((file) => ({ type, slug: path.basename(file, '.json') }));
    }),
  );

  const ingredients = await Promise.all(
    entries.flat().map(({ type, slug }) => getIngredient(type, slug)),
  );

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
 * plus the ones from its child categories, each once. Ordered by how many
 * recipes reference each bottle (most-used first — the common bottles lead
 * as recommendations), ties broken alphabetically.
 */
export const getIngredientsForCategory = async (
  category: Category,
): Promise<RootIngredient[]> => {
  const ingredientsByCategories = await getIngredientPerCategories();
  const categoriesByParent = await getCategoriesPerParent();
  const recipeCounts = await getIngredientRecipeCounts();
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
    .toSorted(byRecipeCountThenName(recipeCounts));
};

type IngredientSubstitutions = {
  /**
   * Every bottle sharing any of the ingredient's declared categories —
   * however the bottle is categorized, its close neighbors are the members
   * of all of them.
   */
  substitutes: RootIngredient[];
  /**
   * The substitution-friendly neighbors of the ingredient's most specific
   * declared category, minus the categories the bottle declares itself.
   */
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
 * - The primary list holds every bottle sharing any of the bottle's
 *   declared categories, each once (e.g. for a Jamaican aged rum declaring
 *   both Blended aged rum (Jamaica) and Jamaican rum, the other bottles of
 *   both). Substitution is bottle-level: however a bottle is categorized,
 *   its close neighbors are the members of all of them.
 * - The secondary list holds the related categories: the
 *   substitution-friendly neighbors of the bottle's most specific declared
 *   category in the category tree — its direct parents and its siblings
 *   (the other children of those parents), e.g. the other aged-rum
 *   categories for a Jamaican aged rum — minus the categories the bottle
 *   declares itself.
 *
 * Returns undefined when the bottle declares no category at all, and
 * when neither list holds anything — a solitary bottle whose categories
 * have no other members and sit nowhere in the category tree (e.g. the
 * only bottle of a parentless category). An empty drawer is worse than
 * no drawer, so the page gets nothing to render.
 */
export const getSubstitutesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<IngredientSubstitutions | undefined> => {
    if (ingredient.categories.length === 0) return undefined;

    const ingredientsByCategories = await getIngredientPerCategories();

    const substitutesBySlug = new Map<string, RootIngredient>();
    for (const { slug: categorySlug } of ingredient.categories) {
      for (const member of ingredientsByCategories[categorySlug] ?? []) {
        if (member.slug !== ingredient.slug) {
          substitutesBySlug.set(member.slug, member);
        }
      }
    }

    const rankedCategories = ingredient.categories
      .map((category, declaredOrder) => ({
        category,
        declaredOrder,
        depth: getCategoryDepth(category),
      }))
      .toSorted((a, b) => b.depth - a.depth || a.declaredOrder - b.declaredOrder);

    const [mostSpecific] = rankedCategories;
    if (mostSpecific === undefined) return undefined;

    const declaredSlugs = new Set(ingredient.categories.map(({ slug }) => slug));
    const relatedCategories = (await getRelatedCategories(mostSpecific.category)).filter(
      ({ slug }) => !declaredSlugs.has(slug),
    );

    const substitutes = [...substitutesBySlug.values()].toSorted(
      byRecipeCountThenName(await getIngredientRecipeCounts()),
    );
    if (substitutes.length === 0 && relatedCategories.length === 0) return undefined;

    return { substitutes, relatedCategories };
  },
  (ingredient) => ingredient.slug,
);

const getRecipesByIngredientSlug = memo(async (): Promise<Map<string, Recipe[]>> => {
  const allRecipes = await getAllRecipes();
  const bySlug = new Map<string, Recipe[]>();

  for (const recipe of allRecipes) {
    const citedSlugs = new Set<string>();

    for (const ingredient of recipe.ingredients) {
      citedSlugs.add(ingredient.slug);

      const techniques =
        ingredient.technique == null
          ? []
          : Array.isArray(ingredient.technique)
            ? ingredient.technique
            : [ingredient.technique];
      for (const technique of techniques) {
        if (technique.technique === 'fat-wash') {
          citedSlugs.add(slugify(technique.fat));
        }
      }
    }

    for (const technique of recipe.techniques ?? []) {
      match(technique)
        .with({ technique: 'clarification', method: 'milk' }, ({ milk_type: milkType }) =>
          citedSlugs.add(slugify(milkType)),
        )
        .exhaustive();
    }

    for (const slug of citedSlugs) {
      let list = bySlug.get(slug);
      if (!list) {
        list = [];
        bySlug.set(slug, list);
      }
      list.push(recipe);
    }
  }

  for (const [slug, list] of bySlug) {
    bySlug.set(slug, toAlphaSort(list));
  }

  return bySlug;
});

export const getRecipesForIngredient = memo(
  async (ingredient: RootIngredient): Promise<Recipe[]> => {
    const bySlug = await getRecipesByIngredientSlug();
    return bySlug.get(ingredient.slug) ?? [];
  },
  (ingredient) => ingredient.slug,
);

/**
 * How many recipes reference each ingredient, keyed by slug. A recipe counts
 * once per ingredient: as a direct ingredient, or as a milk-clarification
 * material — the same references `getRecipesForIngredient` lists per bottle.
 * Popularity ordering of substitution and category-member lists comes from
 * these counts.
 */
export const getIngredientRecipeCounts = memo(async (): Promise<Map<string, number>> => {
  const bySlug = await getRecipesByIngredientSlug();
  return new Map([...bySlug].map(([slug, list]) => [slug, list.length] as const));
});
