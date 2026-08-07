import type { UrlObject } from 'node:url';
import { tryConvertVolume } from '@cocktails/conversion';
import type { Recipe, RecipeIngredient, Source, Technique } from '@cocktails/data';
import slugify from '@sindresorhus/slugify';
import type { Route } from 'next';
import { P, match } from 'ts-pattern';

export function getRecipeUrl(
  recipe: Recipe,
): Route<`/recipes/${string}/${string}/${string}`> {
  return `/recipes/${recipe.source.type}/${recipe.source.slug}/${recipe.slug}`;
}

export function getCategoryUrl(category: { slug: string }): Route<`/category/${string}`> {
  return `/category/${category.slug}`;
}

export function getIngredientUrl(
  ingredient: Omit<RecipeIngredient, 'quantity'>,
): Route<`/category/${string}`> | Route<`/ingredient/${string}/${string}`> {
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

export function getRecipeIngredientUrl(
  ingredient: RecipeIngredient,
): ReturnType<typeof getIngredientUrl> | UrlObject {
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

export function getSourceUrl(source: Source): Route<`/source/${string}/${string}`> {
  return `/source/${source.type}/${source.slug}`;
}

export function getRecipeListUrl(): Route {
  return '/list/recipes';
}

export function getRecentlyAddedUrl(): Route {
  return '/list/recently-added';
}

export function getNonAlcoholicRecipeListUrl(): Route {
  return '/list/non-alcoholic';
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

export function getAuthorRecipesUrl(author: string): Route<`/list/authors/${string}`> {
  return `/list/authors/${slugify(author)}`;
}

export function getBarRecipesUrl(bar: {
  name: string;
  location?: string;
}): Route<`/list/bars/${string}`> {
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
