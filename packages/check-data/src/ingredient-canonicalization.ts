import path from 'node:path';
import {
  compareIngredients,
  type SortableIngredient,
} from '@cocktails/ingredient-sorting';
import slugify from '@sindresorhus/slugify';
import { logger } from './cli-util.ts';
import type { Ingredient } from './types.ts';

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
 * Auto-fixes recipe and ingredient files: flips ingredients that name a
 * category to `type: "category"`, canonicalizes ingredient and category
 * names to their canonical spellings, and sorts recipe ingredients to the
 * app display order. Writes the file back when anything changed.
 */
export async function canonicalizeFile(input: {
  data: {
    name: string;
    type?: string;
    ingredients?: Ingredient[];
    categories?: string[];
  };
  file: string;
  schemaPath: string;
  categorySlugs: ReadonlySet<string>;
  canonicalNames: ReadonlyMap<string, string>;
  categoryCanonicalNames: ReadonlyMap<string, string>;
  categoryTypes: ReadonlyMap<string, string>;
  writeJSON: (filepath: string, data: object) => Promise<void>;
}): Promise<void> {
  const {
    data,
    file,
    schemaPath,
    categorySlugs,
    canonicalNames,
    categoryCanonicalNames,
    categoryTypes,
    writeJSON,
  } = input;

  if (
    schemaPath !== 'schemas/recipe.schema.json' &&
    schemaPath !== 'schemas/ingredient.schema.json'
  ) {
    return;
  }

  const { ingredients = [], categories = [] } = data;
  let fileModified = false;

  // Auto-fix ingredients that should be categories
  for (const ingredient of ingredients) {
    const ingredientSlug = slugify(ingredient.name);
    if (ingredient.type !== 'category' && categorySlugs.has(ingredientSlug)) {
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
    const canonical = canonicalNames.get(ingredientSlug);
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
      const canonical = categoryCanonicalNames.get(slugify(category));
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
    const sortedIngredients = sortRecipeIngredients(ingredients, categoryTypes);
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
