import type { Category, RootIngredient } from '@cocktails/data';
import {
  getAllIngredients,
  getIngredientRecipeCounts,
  getRecipesForIngredient,
  getSubstitutesForIngredient,
} from '@cocktails/data/ingredients';
import { type StoredBottle, toStoredBottle } from '#/modules/bottleRows';
import { serializePageData, toSortedRecord } from '#/modules/pageDataFile';
import { getIngredientUrl } from '#/modules/url';

/**
 * One ingredient page's own entry: the ingredient, the slugs of its
 * categories and substitution content (resolved against the file's shared
 * tables), and how many recipes use it (the recipe rows themselves come
 * from the shared catalog). The title and description are the page's
 * head, set once the entry renders.
 */
type IngredientPageEntry = {
  title: string;
  description: string;
  ingredient: Omit<RootIngredient, 'categories'> & { categories: string[] };
  /** Substitute bottles, most-used first; slugs of `bottles`. */
  substitutes: string[];
  /** Substitution-friendly related categories; slugs of `categories`. */
  relatedCategories: string[];
  recipeCount: number;
};

/**
 * A category as an ingredient page shows it: its chip, its description
 * (the fallback card of a bottle without one), its videos.
 */
type CategoryRow = Pick<Category, 'name' | 'description' | 'refs'>;

/**
 * data/ingredients.json: every ingredient page's entry keyed by its path
 * (`getIngredientUrl`), and the bottles and categories those entries name,
 * each stored once. Substitution lists name the same bottles across many
 * pages, so storing them by slug keeps the file small enough to fetch on a
 * first visit.
 */
export type IngredientPagesFile = {
  pages: Record<string, IngredientPageEntry>;
  bottles: Record<string, StoredBottle>;
  categories: Record<string, CategoryRow>;
};

function toCategoryRow({ name, description, refs }: Category): CategoryRow {
  return description == null ? { name, refs } : { name, description, refs };
}

/**
 * Fold ingredients into the pages file. Keys sort by code unit, so the
 * serialized output does not depend on input order or locale.
 */
export async function buildIngredientPages(
  ingredients: RootIngredient[],
): Promise<IngredientPagesFile> {
  const recipeCounts = await getIngredientRecipeCounts();
  const bottles = new Map<string, StoredBottle>();
  const categories = new Map<string, CategoryRow>();

  const pages = await Promise.all(
    ingredients.map(async (ingredient) => {
      const [substitution, relatedRecipes] = await Promise.all([
        getSubstitutesForIngredient(ingredient),
        getRecipesForIngredient(ingredient),
      ]);

      for (const category of [
        ...ingredient.categories,
        ...(substitution?.relatedCategories ?? []),
      ]) {
        categories.set(category.slug, toCategoryRow(category));
      }
      for (const substitute of substitution?.substitutes ?? []) {
        bottles.set(substitute.slug, toStoredBottle(substitute, recipeCounts));
      }

      const entry: IngredientPageEntry = {
        title: `Indexotica | Learn about ${ingredient.name}`,
        description:
          ingredient.description ??
          `Learn about ${ingredient.name} and find cocktail recipes that use it.`,
        ingredient: {
          ...ingredient,
          categories: ingredient.categories.map(({ slug }) => slug),
        },
        substitutes: (substitution?.substitutes ?? []).map(({ slug }) => slug),
        relatedCategories: (substitution?.relatedCategories ?? []).map(
          ({ slug }) => slug,
        ),
        recipeCount: relatedRecipes.length,
      };

      return [getIngredientUrl(ingredient), entry] as const;
    }),
  );

  return {
    pages: toSortedRecord(pages),
    bottles: toSortedRecord(bottles),
    categories: toSortedRecord(categories),
  };
}

/** Every ingredient page's data, serialized minified for `fetch`. */
export async function getSerializedIngredientPages(): Promise<string> {
  return serializePageData(await buildIngredientPages(await getAllIngredients()));
}
