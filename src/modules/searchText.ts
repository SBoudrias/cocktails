import transliterate from '@sindresorhus/transliterate';
import { formatIngredientName } from '@/modules/technique';
import { type Recipe } from '@/types/Recipe';
import { type Category } from '@/types/Category';
import { type RootIngredient } from '@/types/Ingredient';

/**
 * Returns transliterated lowercase text suitable for fuzzy search matching.
 */
function normalize(text: string): string {
  return transliterate(text).toLowerCase();
}

/**
 * Extracts searchable text from a recipe.
 * Includes recipe name, ingredient names, category names, and attribution sources.
 */
export function getRecipeSearchText(recipe: Recipe): string {
  const ingredientParts = recipe.ingredients.map((ingredient) => {
    const relatedCategories: Category[] = [
      ...('categories' in ingredient ? ingredient.categories : []),
      ...('parents' in ingredient ? ingredient.parents : []),
    ];
    return `${formatIngredientName(ingredient)} ${relatedCategories.map((c) => c.name).join(' ')}`;
  });

  const attributionParts = recipe.attributions.map((attribution) => attribution.source);

  return normalize(
    `${recipe.name} ${ingredientParts.join(' ')} ${attributionParts.join(' ')}`,
  );
}

/**
 * Extracts searchable text from an item with just a name.
 * Returns transliterated lowercase name.
 */
export function getNameSearchText(item: { name: string }): string {
  return normalize(item.name);
}

/**
 * Extracts searchable text from an ingredient.
 * Includes ingredient name and category names.
 */
export function getIngredientSearchText(ingredient: RootIngredient): string {
  const categoryNames = ingredient.categories.map((c) => c.name).join(' ');
  return normalize(`${ingredient.name} ${categoryNames}`);
}

/**
 * Extracts searchable text from an attribution (bar or author).
 * Includes name and location when present.
 */
export function getAttributionSearchText(item: {
  name: string;
  location?: string;
}): string {
  const parts = [item.name];
  if (item.location) {
    parts.push(item.location);
  }
  return normalize(parts.join(' '));
}
