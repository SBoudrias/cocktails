import path from 'node:path';
import {
  compareIngredients,
  type SortableIngredient,
} from '@cocktails/ingredient-sorting';
import slugify from '@sindresorhus/slugify';
import { logger } from '../../cli-util.ts';
import { ctx } from '../../context/data-context.ts';
import type { FileCheckInput, Ingredient } from '../../infra/types.ts';
import { writeJSON } from '../../infra/write-json.ts';

function addCategoryType(
  ingredient: Ingredient,
  categoryTypes: ReadonlyMap<string, string>,
): SortableIngredient {
  return {
    type: ingredient.type,
    categoryType:
      ingredient.type === 'category'
        ? categoryTypes.get(slugify(ingredient.name))
        : undefined,
    quantity: ingredient.quantity!,
    technique: ingredient.technique,
  };
}

function sortRecipeIngredients(
  ingredients: Ingredient[],
  categoryTypes: ReadonlyMap<string, string>,
): Ingredient[] {
  return ingredients.toSorted((a, b) => {
    if (!a.quantity || !b.quantity) return 0;
    return compareIngredients(
      addCategoryType(a, categoryTypes),
      addCategoryType(b, categoryTypes),
    );
  });
}

/**
 * Auto-fixes before metadata creation: flips recipe ingredients that name a
 * category to `type: "category"`, canonicalizes ingredient names, category
 * names and category parents to their canonical spellings, and sorts recipe
 * ingredients to the app display order. Writes the file back when anything
 * changed.
 */
export async function canonicalizeFile({
  data,
  file,
  schemaPath,
}: FileCheckInput): Promise<void> {
  if (
    schemaPath === 'schemas/recipe.schema.json' ||
    schemaPath === 'schemas/ingredient.schema.json'
  ) {
    const { ingredients = [], categories = [] } = data;
    let fileModified = false;

    // Auto-fix ingredients that should be categories
    for (const ingredient of ingredients) {
      const ingredientSlug = slugify(ingredient.name);
      if (ingredient.type !== 'category' && ctx.categorySlugs.has(ingredientSlug)) {
        logger.change(
          `Fixing "${ingredient.name}" in ${path.basename(file)}: ` +
            `type "${ingredient.type}" → "category"`,
        );
        ingredient.type = 'category';
        fileModified = true;
      }
    }

    // Auto-fix ingredient name capitalization to match canonical names
    for (const ingredient of ingredients) {
      const ingredientSlug = slugify(ingredient.name);
      const canonical = ctx.canonicalNames.get(ingredientSlug);
      if (canonical && canonical !== ingredient.name) {
        logger.change(
          `Fixing "${ingredient.name}" → "${canonical}" in ${path.basename(file)}`,
        );
        ingredient.name = canonical;
        fileModified = true;
      }
    }

    // Auto-fix category names on ingredient files to match the canonical
    // category names, so variants like "Tequila Blanco" vs "Tequila (Blanco)"
    // or "Orange liqueur" vs "Orange Liqueur" don't accumulate.
    if (schemaPath === 'schemas/ingredient.schema.json') {
      for (const [i, category] of categories.entries()) {
        const canonical = ctx.categoryCanonicalNames.get(slugify(category));
        if (canonical && canonical !== category) {
          logger.change(
            `Fixing category "${category}" → "${canonical}" in ${path.basename(file)}`,
          );
          categories[i] = canonical;
          fileModified = true;
        }
      }
    }

    // Sort recipe ingredients to match app display order
    if (schemaPath === 'schemas/recipe.schema.json' && ingredients.length > 1) {
      const sortedIngredients = sortRecipeIngredients(ingredients, ctx.categoryTypes);
      const ingredientsChanged = ingredients.some(
        (ing, i) => ing.name !== sortedIngredients[i]?.name,
      );
      if (ingredientsChanged) {
        data.ingredients = sortedIngredients;
        fileModified = true;
      }
    }

    if (fileModified) {
      await writeJSON(file, data);
    }
  }

  // Auto-fix parent names on category files to match the canonical category
  // names.
  if (schemaPath === 'schemas/category.schema.json') {
    let fileModified = false;

    const parents = data.parents ?? [];
    for (const [i, parent] of parents.entries()) {
      const canonical = ctx.categoryCanonicalNames.get(slugify(parent));
      if (canonical && canonical !== parent) {
        logger.change(
          `Fixing parent "${parent}" → "${canonical}" in ${path.basename(file)}`,
        );
        parents[i] = canonical;
        fileModified = true;
      }
    }

    if (fileModified) {
      await writeJSON(file, data);
    }
  }
}
