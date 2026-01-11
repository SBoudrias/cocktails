import transliterate from '@sindresorhus/transliterate';
import { formatIngredientName } from '@/modules/technique';
import { type Recipe, type Attribution } from '@/types/Recipe';
import { type Category } from '@/types/Category';
import { type BaseIngredient, type RecipeIngredient } from '@/types/Ingredient';

/**
 * Returns transliterated lowercase text suitable for fuzzy search matching.
 */
function normalize(text: string): string {
  return transliterate(text).toLowerCase().trim();
}

/**
 * Extracts searchable text from a recipe ingredient.
 * Includes ingredient name and category names.
 */
function getIngredientSearchText(ingredient: RecipeIngredient): string {
  const relatedCategories: Category[] = [
    ...('categories' in ingredient ? ingredient.categories : []),
    ...('parents' in ingredient ? ingredient.parents : []),
  ];
  const categoryNames = relatedCategories.map((c) => c.name).join(' ');
  return `${formatIngredientName(ingredient)} ${categoryNames}`;
}

/**
 * Extracts searchable text from an attribution (bar or author).
 */
function getAttributionSearchText(attribution: Attribution): string {
  return attribution.source;
}

/**
 * Extracts searchable text from a recipe.
 * Includes recipe name, ingredient names, category names, and attribution sources.
 */
export function getRecipeSearchText(recipe: Recipe): string {
  const ingredientParts = recipe.ingredients.map(getIngredientSearchText);
  const attributionParts = recipe.attributions.map(getAttributionSearchText);

  return normalize(
    `${recipe.name} ${ingredientParts.join(' ')} ${attributionParts.join(' ')}`,
  );
}

/**
 * Extracts searchable text from an ingredient or category list item.
 * Includes name and parent category names.
 */
export function getIngredientOrCategorySearchText(
  item: BaseIngredient | Category,
): string {
  const relatedCategories: Category[] =
    'categories' in item ? item.categories : item.parents;
  const categoryNames = relatedCategories.map((c) => c.name).join(' ');

  return normalize(`${item.name} ${categoryNames}`);
}
