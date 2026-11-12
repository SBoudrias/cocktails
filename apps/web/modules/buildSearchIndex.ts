import type { Recipe, Source } from '@cocktails/data';
import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import { getAllRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import slugify from '@sindresorhus/slugify';
import { P, match } from 'ts-pattern';
import { normalizeEntityText } from '#/modules/entitySuggestions';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import {
  getAuthorRecipesUrl,
  getBarRecipesUrl,
  getCategoryUrl,
  getIngredientUrl,
  getRecipeUrl,
  getSourceUrl,
} from '#/modules/url';

/**
 * What global search needs to match and render a recipe that is not on the
 * current page. `searchText` lives only here: list pages ship display fields
 * and look their recipes' search text up by href.
 */
export type SearchIndexEntry = { name: string; source: string; searchText: string };

/**
 * The entity kinds the index carries, one per page shape: category,
 * ingredient, author, bar, and the catalog source types. Suggestions pick
 * their icon and label by kind.
 */
export type SearchIndexEntityKind =
  | 'category'
  | 'ingredient'
  | 'author'
  | 'bar'
  | Source['type'];

/**
 * What global search needs to match and suggest an entity page: recipes stay
 * the results below, entities surface above them. `searchText` is the name
 * (plus a bar's location) in `normalizeEntityText` form — the shape the
 * query is normalized to too, so strong matching is a plain string test.
 */
export type SearchIndexEntityEntry = {
  name: string;
  kind: SearchIndexEntityKind;
  searchText: string;
};

/**
 * Every recipe and entity page, keyed by its href. The key makes the file
 * deploy-skew tolerant: a page and an index built from different data still
 * match on whatever hrefs they share — and consumers tell recipes from
 * entities by their entry's shape (`source` vs `kind`), not by the key.
 */
export type SearchIndex = Record<string, SearchIndexEntry | SearchIndexEntityEntry>;

/**
 * Build the index from projected list items (the single source of
 * `searchText`), with keys in code-unit order. The output feeds the build
 * artifact cache, so it must not depend on input order or on the locale.
 */
export function buildSearchIndex(
  items: ((SearchIndexEntry | SearchIndexEntityEntry) & { href: string })[],
): SearchIndex {
  const sorted = items.toSorted((a, b) => {
    if (a.href === b.href) return 0;
    return a.href < b.href ? -1 : 1;
  });

  return Object.fromEntries(sorted.map(({ href, ...entry }) => [href, entry]));
}

/**
 * Serialize the index of every recipe and entity in the data package.
 * Minified, since the file is only ever read by `fetch`.
 */
export async function getSerializedSearchIndex(): Promise<string> {
  const recipes = await getAllRecipes();
  const [recipeItems, entityItems] = await Promise.all([
    toSearchIndexItems(recipes),
    toSearchIndexEntityItems(recipes),
  ]);

  return JSON.stringify(buildSearchIndex([...recipeItems, ...entityItems]));
}

/**
 * Project recipes into the index's entries, with the href they are keyed by.
 */
export function toSearchIndexItems(
  recipes: Recipe[],
): (SearchIndexEntry & { href: string })[] {
  return recipes.map((recipe) => ({
    href: getRecipeUrl(recipe),
    name: recipe.name,
    source: getRecipeSource(recipe),
    searchText: getRecipeSearchText(recipe),
  }));
}

/**
 * Project every navigable entity — categories, ingredients, authors, bars,
 * and catalog sources — into the index's entity entries, keyed by their
 * pages' hrefs. Authors and bars derive from recipe attributions, exactly
 * like their pages' routes do, so a suggestion never links to a page that
 * does not exist; ingredients, categories, and sources come from the loaders
 * that enumerate the same files their pages are built from.
 */
export async function toSearchIndexEntityItems(
  recipes: Recipe[],
): Promise<(SearchIndexEntityEntry & { href: string })[]> {
  const [categories, ingredients, sources] = await Promise.all([
    getAllCategories(),
    getAllIngredients(),
    getAllSources(),
  ]);

  // Authors and bars keyed by the slug of their page href — the attribution
  // pass deduplicates there, and the key keeps distinct locations apart.
  const authors = new Map<string, { name: string }>();
  const bars = new Map<string, { name: string; location?: string }>();

  for (const { attributions } of recipes) {
    for (const attribution of attributions) {
      match(attribution)
        .with({ relation: P.union('recipe author', 'adapted by') }, ({ source }) => {
          authors.set(slugify(source), { name: source });
        })
        .with({ relation: 'bar' }, ({ source, location }) => {
          bars.set(slugify(`${source} ${location ?? ''}`), {
            name: source,
            ...(location ? { location } : {}),
          });
        })
        .otherwise(() => undefined);
    }
  }

  // The annotation keeps each literal kind narrow (a bare map's object
  // literal widens to string without a contextual type).
  const entries: (SearchIndexEntityEntry & { href: string })[] = [
    ...categories.map((category): SearchIndexEntityEntry & { href: string } => ({
      href: getCategoryUrl(category),
      name: category.name,
      kind: 'category',
      searchText: normalizeEntityText(category.name),
    })),
    ...ingredients.map((ingredient): SearchIndexEntityEntry & { href: string } => ({
      href: getIngredientUrl(ingredient),
      name: ingredient.name,
      kind: 'ingredient',
      searchText: normalizeEntityText(ingredient.name),
    })),
    ...[...authors.values()].map((author): SearchIndexEntityEntry & { href: string } => ({
      href: getAuthorRecipesUrl(author.name),
      name: author.name,
      kind: 'author',
      searchText: normalizeEntityText(author.name),
    })),
    ...[...bars.values()].map((bar): SearchIndexEntityEntry & { href: string } => ({
      href: getBarRecipesUrl(bar),
      name: bar.name,
      kind: 'bar',
      searchText: normalizeEntityText(`${bar.name} ${bar.location ?? ''}`),
    })),
    ...sources.map((source): SearchIndexEntityEntry & { href: string } => ({
      href: getSourceUrl(source),
      name: source.name,
      kind: source.type,
      searchText: normalizeEntityText(source.name),
    })),
  ];

  return entries;
}
