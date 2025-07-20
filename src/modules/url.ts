import { RecipeIngredient } from '@/types/Ingredient';
import { Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import slugify from '@sindresorhus/slugify';

export function getRecipeUrl(recipe: Recipe) {
  return `/recipes/${recipe.source.type}/${recipe.source.slug}/${recipe.slug}`;
}

export function getCategoryUrl(category: { slug: string }) {
  return `/category/${category.slug}`;
}

export function getIngredientUrl(ingredient: Omit<RecipeIngredient, 'quantity'>) {
  if (ingredient.type === 'category') return getCategoryUrl(ingredient);

  return `/ingredient/${ingredient.type}/${ingredient.slug}`;
}

export function getSourceUrl(source: Source) {
  return `/source/${source.type}/${source.slug}`;
}

export function getSearchUrl() {
  return `/search`;
}

export function getBottleListUrl() {
  return '/list/bottles';
}

export function getIngredientListUrl() {
  return '/list/ingredients';
}

export function getAuthorListUrl() {
  return '/list/authors';
}

export function getBarListUrl() {
  return '/list/bars';
}

export function getAuthorRecipesUrl(author: string) {
  return `/list/authors/${slugify(author)}`;
}

export function getBarRecipesUrl(bar: string) {
  return `/list/bars/${slugify(bar)}`;
}
