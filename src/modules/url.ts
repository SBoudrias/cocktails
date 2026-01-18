import type { Route } from 'next';
import slugify from '@sindresorhus/slugify';
import type { RecipeIngredient } from '@/types/Ingredient';
import type { Recipe } from '@/types/Recipe';
import type { Source } from '@/types/Source';

export function getRecipeUrl(recipe: Recipe): Route {
  return `/recipes/${recipe.source.type}/${recipe.source.slug}/${recipe.slug}` as Route;
}

export function getCategoryUrl(category: { slug: string }): Route {
  return `/category/${category.slug}` as Route;
}

export function getIngredientUrl(ingredient: Omit<RecipeIngredient, 'quantity'>): Route {
  if (ingredient.type === 'category') return getCategoryUrl(ingredient);

  return `/ingredient/${ingredient.type}/${ingredient.slug}` as Route;
}

export function getSourceUrl(source: Source): Route {
  return `/source/${source.type}/${source.slug}` as Route;
}

export function getRecipeListUrl(): Route {
  return '/list/recipes';
}

export function getBottleListUrl(): Route {
  return '/list/bottles';
}

export function getIngredientListUrl(): Route {
  return '/list/ingredients';
}

export function getAuthorListUrl(): Route {
  return '/list/authors';
}

export function getBarListUrl(): Route {
  return '/list/bars';
}

export function getAuthorRecipesUrl(author: string): Route {
  return `/list/authors/${slugify(author)}` as Route;
}

export function getBarRecipesUrl(bar: { name: string; location?: string }): Route {
  return `/list/bars/${slugify(`${bar.name} ${bar.location ?? ''}`)}` as Route;
}
