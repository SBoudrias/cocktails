import type { Category } from '@cocktails/data';
import { getAllCategories, getChildCategories } from '@cocktails/data/categories';
import {
  getIngredientRecipeCounts,
  getIngredientsForCategory,
} from '@cocktails/data/ingredients';
import { getRecipeByCategory } from '@cocktails/data/recipes';
import { type StoredBottle, toStoredBottle } from '#/modules/bottleRows';
import { serializePageData, toSortedRecord } from '#/modules/pageDataFile';
import { getCategoryUrl } from '#/modules/url';

/**
 * One category page's own entry: the category, the slugs of its parents,
 * children and member bottles (resolved against the file's shared tables),
 * and how many recipes use it (the recipe rows themselves come from the
 * shared catalog). The title and description are the page's head, set
 * once the entry renders.
 */
type CategoryPageEntry = {
  title: string;
  description: string;
  category: Pick<Category, 'name' | 'slug' | 'description' | 'refs'>;
  /** Parent categories, the chips under the title; slugs of `categories`. */
  parents: string[];
  /** Child categories; slugs of `categories`. */
  children: string[];
  /** Member bottles, most-used first; slugs of `bottles`. */
  members: string[];
  recipeCount: number;
};

/**
 * data/categories.json: every category page's entry keyed by its path
 * (`getCategoryUrl`), and the bottles and category names those entries
 * name, each stored once.
 */
export type CategoryPagesFile = {
  pages: Record<string, CategoryPageEntry>;
  bottles: Record<string, StoredBottle>;
  categories: Record<string, { name: string }>;
};

/**
 * Fold categories into the pages file. Keys sort by code unit, so the
 * serialized output does not depend on input order or locale.
 */
export async function buildCategoryPages(
  categories: Category[],
): Promise<CategoryPagesFile> {
  const recipeCounts = await getIngredientRecipeCounts();
  const bottles = new Map<string, StoredBottle>();
  const names = new Map<string, { name: string }>();

  const pages = await Promise.all(
    categories.map(async (category) => {
      const [members, relatedRecipes, children] = await Promise.all([
        getIngredientsForCategory(category),
        getRecipeByCategory(category),
        getChildCategories(category),
      ]);

      for (const { slug, name } of [...category.parents, ...children]) {
        names.set(slug, { name });
      }
      for (const member of members) {
        bottles.set(member.slug, toStoredBottle(member, recipeCounts));
      }

      const { name, slug, description, refs } = category;
      const entry: CategoryPageEntry = {
        title: `Indexotica | Learn about ${name}`,
        description:
          description ??
          `Learn about ${name}, its bottles and the cocktail recipes that use it.`,
        category:
          description == null ? { name, slug, refs } : { name, slug, description, refs },
        parents: category.parents.map((parent) => parent.slug),
        children: children.map((child) => child.slug),
        members: members.map((member) => member.slug),
        recipeCount: relatedRecipes.length,
      };

      return [getCategoryUrl(category), entry] as const;
    }),
  );

  return {
    pages: toSortedRecord(pages),
    bottles: toSortedRecord(bottles),
    categories: toSortedRecord(names),
  };
}

/** Every category page's data, serialized minified for `fetch`. */
export async function getSerializedCategoryPages(): Promise<string> {
  return serializePageData(await buildCategoryPages(await getAllCategories()));
}
