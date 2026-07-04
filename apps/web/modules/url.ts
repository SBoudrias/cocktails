import type { UrlObject } from 'node:url';
import { tryConvertVolume } from '@cocktails/conversion';
import type { Recipe, RecipeIngredient, Source, Technique } from '@cocktails/data';
import slugify from '@sindresorhus/slugify';
import { P, match } from 'ts-pattern';

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

function getTechniqueContext(technique: Technique) {
  return match(technique)
    .with({ technique: 'clarification', method: 'milk' }, () => 'clarification:milk')
    .with({ technique: 'clarification', milk_type: P.string }, () => 'clarification:milk')
    .with(
      { technique: 'clarification', agent: P.string },
      ({ agent }) => `clarification:${slugify(agent)}`,
    )
    .with({ technique: 'clarification' }, () => 'clarification')
    .otherwise(({ technique }) => technique);
}

function getAcidAdjustedJuiceAmount(
  ingredient: RecipeIngredient,
  techniques: Technique[],
) {
  const isAcidAdjusted = techniques.some((technique) =>
    match(technique)
      .with({ technique: 'acid-adjustment' }, () => true)
      .otherwise(() => false),
  );
  if (!isAcidAdjusted) {
    return undefined;
  }

  return tryConvertVolume(ingredient.quantity, 'oz')?.amount;
}

export function getRecipeIngredientUrl(ingredient: RecipeIngredient): string | UrlObject {
  const pathname = getIngredientUrl(ingredient);
  if (ingredient.type === 'category' || ingredient.technique == null) {
    return pathname;
  }

  const techniques = Array.isArray(ingredient.technique)
    ? ingredient.technique
    : [ingredient.technique];
  const juiceAmount = getAcidAdjustedJuiceAmount(ingredient, techniques);

  return {
    pathname,
    query: {
      technique: techniques.map(getTechniqueContext),
      amount: String(ingredient.quantity.amount),
      unit: ingredient.quantity.unit,
      ...(juiceAmount === undefined ? {} : { juiceAmount: String(juiceAmount) }),
    },
  };
}

export function getSourceUrl(source: Source) {
  return `/source/${source.type}/${source.slug}`;
}

export function getRecipeListUrl() {
  return '/list/recipes';
}

export function getRecentlyAddedUrl() {
  return '/list/recently-added';
}

export function getNonAlcoholicRecipeListUrl() {
  return '/list/non-alcoholic';
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
