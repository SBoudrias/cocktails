import type { Recipe, RecipeIngredient, Source } from '@cocktails/data';
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

export function getRecipeListUrl() {
  return '/list/recipes';
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

export function getBarRecipesUrl(bar: { name: string; location?: string }) {
  return `/list/bars/${slugify(`${bar.name} ${bar.location ?? ''}`)}`;
}

export function getRecipeEditUrl(recipe: Recipe) {
  const basePath = `https://github.com/SBoudrias/cocktails/edit/main/packages/data/data/recipes/${recipe.source.type}/${recipe.source.slug}`;

  if (recipe.chapter) {
    const chapterFolder = `${String(recipe.chapter.order).padStart(2, '0')}_${recipe.chapter.name}`;
    return `${basePath}/${encodeURIComponent(chapterFolder)}/${recipe.slug}.json`;
  }

  return `${basePath}/${recipe.slug}.json`;
}
