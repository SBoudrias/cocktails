import type { Recipe, Source } from '@cocktails/data';
import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients, getRecipesForIngredient } from '@cocktails/data/ingredients';
import { getAllRecipes, getRecipeByCategory } from '@cocktails/data/recipes';
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
 * An entity makes the index only when at least this many recipes reference
 * it. A suggestion row is promoted above the recipe results, and an entity
 * worth that is one the catalog leans on (Rum, not a bottle a single recipe
 * lists once), so low-reference names never surface as suggestions.
 */
export const MIN_ENTITY_REFERENCES = 3;

/**
 * Project every navigable entity — categories, ingredients, authors, bars,
 * and catalog sources — into the index's entity entries, keyed by their
 * pages' hrefs. Authors and bars derive from recipe attributions, exactly
 * like their pages' routes do, so a suggestion never links to a page that
 * does not exist; ingredients, categories, and sources come from the loaders
 * that enumerate the same files their pages are built from. Each entity must
 * also clear `MIN_ENTITY_REFERENCES`: the counts mirror what the entity's
 * own page lists (a category counts its child categories' recipes too, a
 * source counts every recipe it carries).
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
  // pass counts references there, and the key keeps distinct locations apart.
  // One recipe credits a name at most once: the same author as both writer
  // and adapter is one reference, not two.
  const authors = new Map<string, { name: string; count: number }>();
  const bars = new Map<string, { name: string; location?: string; count: number }>();

  for (const { attributions } of recipes) {
    const creditedAuthors = new Map<string, string>();
    const creditedBars = new Map<string, { name: string; location?: string }>();

    for (const attribution of attributions) {
      match(attribution)
        .with({ relation: P.union('recipe author', 'adapted by') }, ({ source }) => {
          creditedAuthors.set(slugify(source), source);
        })
        .with({ relation: 'bar' }, ({ source, location }) => {
          creditedBars.set(slugify(`${source} ${location ?? ''}`), {
            name: source,
            ...(location ? { location } : {}),
          });
        })
        .otherwise(() => undefined);
    }

    for (const [slug, name] of creditedAuthors) {
      const author = authors.get(slug);
      authors.set(slug, { name: author?.name ?? name, count: (author?.count ?? 0) + 1 });
    }
    for (const [slug, { name, location }] of creditedBars) {
      const bar = bars.get(slug);
      bars.set(slug, {
        name: bar?.name ?? name,
        ...((location ?? bar?.location) ? { location: location ?? bar?.location } : {}),
        count: (bar?.count ?? 0) + 1,
      });
    }
  }

  const [citedCategories, citedIngredients] = await Promise.all([
    toCitedEntries(categories, 'category', getCategoryUrl, (category) =>
      getRecipeByCategory(category),
    ),
    toCitedEntries(ingredients, 'ingredient', getIngredientUrl, (ingredient) =>
      getRecipesForIngredient(ingredient),
    ),
  ]);

  const entries: (SearchIndexEntityEntry & { href: string })[] = [
    ...citedCategories,
    ...citedIngredients,
    ...[...authors]
      .filter(([, author]) => author.count >= MIN_ENTITY_REFERENCES)
      .map(([, author]): SearchIndexEntityEntry & { href: string } => ({
        href: getAuthorRecipesUrl(author.name),
        name: author.name,
        kind: 'author',
        searchText: normalizeEntityText(author.name),
      })),
    ...[...bars]
      .filter(([, bar]) => bar.count >= MIN_ENTITY_REFERENCES)
      .map(([, bar]): SearchIndexEntityEntry & { href: string } => ({
        href: getBarRecipesUrl(bar),
        name: bar.name,
        kind: 'bar',
        searchText: normalizeEntityText(`${bar.name} ${bar.location ?? ''}`),
      })),
    ...sources
      .filter((source) => source.recipeAmount >= MIN_ENTITY_REFERENCES)
      .map((source): SearchIndexEntityEntry & { href: string } => ({
        href: getSourceUrl(source),
        name: source.name,
        kind: source.type,
        searchText: normalizeEntityText(source.name),
      })),
  ];

  return entries;
}

/** The entities of a list that enough recipes reference, as index entries. */
async function toCitedEntries<T extends { name: string }>(
  entities: T[],
  kind: SearchIndexEntityKind,
  getHref: (entity: T) => string,
  listRecipes: (entity: T) => Promise<unknown[]>,
): Promise<(SearchIndexEntityEntry & { href: string })[]> {
  const cited = await Promise.all(
    entities.map(async (entity) => ({
      entity,
      count: (await listRecipes(entity)).length,
    })),
  );

  return cited
    .filter(({ count }) => count >= MIN_ENTITY_REFERENCES)
    .map(({ entity }): SearchIndexEntityEntry & { href: string } => ({
      href: getHref(entity),
      name: entity.name,
      kind,
      searchText: normalizeEntityText(entity.name),
    }));
}
