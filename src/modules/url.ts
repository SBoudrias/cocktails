import { BaseIngredient } from '@/types/Ingredient';
import { Recipe } from '@/types/Recipe';

export function getRecipeUrl(recipe: Recipe) {
  return `/recipes/${recipe.source.type}/${recipe.source.slug}/${recipe.slug}`;
}

export function getCategoryUrl(category: { slug: string }) {
  return `/category/${category.slug}`;
}

export function getIngredientUrl(ingredient: BaseIngredient) {
  if (ingredient.type === 'category') return getCategoryUrl(ingredient);

  return `/ingredient/${ingredient.type}/${ingredient.slug}`;
}
