import transliterate from '@sindresorhus/transliterate';
import type { SearchIndex, SearchIndexEntityEntry } from './buildSearchIndex';

/** One entity the search-all page suggests above its recipe results. */
export type EntitySuggestion = SearchIndexEntityEntry & { href: string };

/**
 * Suggestions only appear once the query is this many characters. Below it a
 * starts-with rule matches every entity opening with those letters ("gi"
 * alone hits Gin, Ginger… and dozens more), so the section would be noise or
 * an arbitrary truncation of it; three characters is where a typed prefix
 * starts to disambiguate.
 */
export const ENTITY_SUGGESTION_MIN_CHARS = 3;

/** At most this many suggestions: more would crowd the recipe results. */
export const MAX_ENTITY_SUGGESTIONS = 2;

/**
 * A query with more strong matches than this is too broad to surface any:
 * the typed term still names a crowd ("sun" hits Suntory Toki, Suntory
 * Kakubin…), and promoting an arbitrary two of them above the recipe
 * results reads as noise. Recipes-only stays the honest answer until the
 * term narrows ("sunk" → Sunkist). The gate sits above the display cap so
 * an unambiguous term with a handful of matches still shows its two best.
 */
export const MAX_ENTITY_SUGGESTION_MATCHES = 5;

/**
 * The text strong matching runs on, for names and queries alike: transliterated
 * and lowercased (accents and case never gate a match), apostrophes folded away
 * ("Smuggler's" ≡ "Smugglers"), attached punctuation dropped and dashes spaced
 * ("Blended aged rum (Jamaica)" ≡ "blended aged rum jamaica"), whitespace
 * collapsed.
 */
export function normalizeEntityText(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[()[\]{}.,;:!?]/g, '')
    .replace(/[-–—_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A query strongly matches an entity when, after normalization, it is
 *   - the start of the entity's name ("app" → Appleton Estate), or
 *   - a whole word of it ("cove" → Smuggler's Cove).
 * A substring that is neither ("ove", "rgentha") is not strong — those hits
 * stay fuzzy recipe-search territory, so they never surface an entity card.
 */
function isStrongMatch(searchText: string, query: string): boolean {
  if (searchText.startsWith(query)) return true;

  return (
    searchText === query ||
    searchText.startsWith(`${query} `) ||
    searchText.endsWith(` ${query}`) ||
    searchText.includes(` ${query} `)
  );
}

/**
 * The entities worth surfacing for a search term: strong matches from the
 * shared search index, at most `MAX_ENTITY_SUGGESTIONS`, name-prefix matches
 * first and shorter (more specific) names before longer ones — and none at
 * all when more than `MAX_ENTITY_SUGGESTION_MATCHES` entities match, where
 * the term is too broad to pick from. While the index has not loaded, or the
 * query is below the character threshold, there are none — recipe search
 * alone still works in the meantime.
 */
export function getEntitySuggestions(
  index: SearchIndex | undefined,
  searchTerm: string | null,
): EntitySuggestion[] {
  const query = normalizeEntityText(searchTerm ?? '');
  if (index == null || query.length < ENTITY_SUGGESTION_MIN_CHARS) return [];

  const candidates = Object.entries(index).flatMap(([href, entry]) =>
    // Recipes (entries with a source) are the results below, not suggestions.
    'kind' in entry
      ? [{ href, name: entry.name, kind: entry.kind, searchText: entry.searchText }]
      : [],
  );

  const matches = candidates.filter((candidate) =>
    isStrongMatch(candidate.searchText, query),
  );
  if (matches.length > MAX_ENTITY_SUGGESTION_MATCHES) return [];

  return matches
    .toSorted(
      (a, b) =>
        Number(b.searchText.startsWith(query)) - Number(a.searchText.startsWith(query)) ||
        a.searchText.length - b.searchText.length ||
        a.searchText.localeCompare(b.searchText),
    )
    .slice(0, MAX_ENTITY_SUGGESTIONS);
}
