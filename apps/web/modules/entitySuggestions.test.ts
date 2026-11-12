import { describe, expect, it } from 'vitest';
import type { SearchIndex } from './buildSearchIndex';
import {
  ENTITY_SUGGESTION_MIN_CHARS,
  MAX_ENTITY_SUGGESTIONS,
  getEntitySuggestions,
  normalizeEntityText,
} from './entitySuggestions';

const index: SearchIndex = {
  '/recipes/book/test-source/daiquiri': {
    name: 'Daiquiri',
    source: 'Test Source',
    searchText: 'daiquiri white rum lime',
  },
  '/category/gin': {
    name: 'Gin',
    kind: 'category',
    searchText: 'gin',
  },
  '/ingredient/spirit/appleton-estate': {
    name: 'Appleton Estate',
    kind: 'ingredient',
    searchText: 'appleton estate',
  },
  '/list/bars/smugglers-cove': {
    name: "Smuggler's Cove",
    kind: 'bar',
    searchText: 'smugglers cove san francisco',
  },
  '/list/authors/jeff-berry': {
    name: 'Jeff Berry',
    kind: 'author',
    searchText: 'jeff berry',
  },
  '/list/authors/jeffrey-morganthau': {
    name: 'Jeffrey Morganthau',
    kind: 'author',
    searchText: 'jeffrey morganthau',
  },
  '/source/book/sippin-safari': {
    name: 'Sippin Safari',
    kind: 'book',
    searchText: 'sippin safari',
  },
};

describe('normalizeEntityText', () => {
  it('transliterates, lowercases, folds punctuation and collapses whitespace', () => {
    expect(normalizeEntityText("Smuggler's Cove (Jamaica)–Blended")).toBe(
      'smugglers cove jamaica blended',
    );
    expect(normalizeEntityText('Crème de Mûre')).toBe('creme de mure');
  });
});

describe('getEntitySuggestions', () => {
  it('suggests entities whose name starts with the query', () => {
    const suggestions = getEntitySuggestions(index, 'app');

    expect(suggestions).toEqual([
      {
        href: '/ingredient/spirit/appleton-estate',
        name: 'Appleton Estate',
        kind: 'ingredient',
        searchText: 'appleton estate',
      },
    ]);
  });

  it('suggests entities the query matches as a whole word', () => {
    const suggestions = getEntitySuggestions(index, 'cove');

    expect(suggestions.map((suggestion) => suggestion.name)).toEqual(["Smuggler's Cove"]);
  });

  it('never suggests on a substring that is neither prefix nor whole word', () => {
    expect(getEntitySuggestions(index, 'state')).toEqual([]);
    expect(getEntitySuggestions(index, 'rganth')).toEqual([]);
    expect(getEntitySuggestions(index, 'organthau')).toEqual([]);
  });

  it('ignores recipes: their entries never surface as suggestions', () => {
    expect(getEntitySuggestions(index, 'daiquiri')).toEqual([]);
  });

  it('matches through accents and apostrophes', () => {
    const withAccents: SearchIndex = {
      '/category/creme-de-mure': {
        name: 'Crème de Mûre',
        kind: 'category',
        searchText: normalizeEntityText('Crème de Mûre'),
      },
    };

    expect(getEntitySuggestions(withAccents, 'cre')).toHaveLength(1);
    expect(getEntitySuggestions(withAccents, 'crème de mûre')).toHaveLength(1);
  });

  it('shows nothing below the character threshold', () => {
    const below = 'ap'.slice(0, ENTITY_SUGGESTION_MIN_CHARS - 1);

    expect(below.length).toBeLessThan(ENTITY_SUGGESTION_MIN_CHARS);
    expect(getEntitySuggestions(index, below)).toEqual([]);
    expect(getEntitySuggestions(index, 'app')).not.toEqual([]);
  });

  it('shows nothing while the index has not loaded', () => {
    expect(getEntitySuggestions(undefined, 'app')).toEqual([]);
  });

  it('caps the suggestions at the limit, prefix matches and shorter names first', () => {
    const manyJeffs: SearchIndex = {
      ...index,
      '/list/authors/jeff-aly': {
        name: 'Jeff Aly',
        kind: 'author',
        searchText: 'jeff aly',
      },
      '/list/authors/jeff-bee': {
        name: 'Jeff Bee',
        kind: 'author',
        searchText: 'jeff bee',
      },
    };

    const suggestions = getEntitySuggestions(manyJeffs, 'jeff');

    expect(suggestions).toHaveLength(MAX_ENTITY_SUGGESTIONS);
    // Both prefix matches come first, shorter (more specific) name before
    // longer ones; the whole-word-only Jeffrey Morganthau is left out.
    expect(suggestions.map((suggestion) => suggestion.name)).toEqual([
      'Jeff Aly',
      'Jeff Bee',
    ]);
  });

  it('ranks a prefix match ahead of a whole-word match', () => {
    const suggestions = getEntitySuggestions(
      {
        ...index,
        '/list/authors/cove-person': {
          name: 'Cove Person',
          kind: 'author',
          searchText: 'cove person',
        },
      },
      'cove',
    );

    expect(suggestions.map((suggestion) => suggestion.name)).toEqual([
      'Cove Person',
      "Smuggler's Cove",
    ]);
  });
});
