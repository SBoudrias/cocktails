import { describe, expect, it } from 'vitest';
import {
  type SourceAttributionEntry,
  findDuplicateBookCredits,
  findRedundantSourceAttributions,
} from './duplicate-source-attribution.ts';

const sourceNames = new Map([
  ['youtube-channel/make-and-drink', 'Make and Drink'],
  ['book/pdt-cocktail-book', 'The PDT Cocktail Book'],
  ['book/smugglers-cove', "Smuggler's Cove"],
]);

function recipe(overrides: Partial<SourceAttributionEntry> = {}): SourceAttributionEntry {
  return {
    file: 'data/recipes/youtube-channel/make-and-drink/boat-days.json',
    sourceType: 'youtube-channel',
    sourceSlug: 'make-and-drink',
    attributions: [{ relation: 'recipe author', source: 'Derek Cole' }],
    refs: [],
    ...overrides,
  };
}

describe('findRedundantSourceAttributions', () => {
  it('flags an attribution crediting the recipe own source', () => {
    const redundant = recipe({
      attributions: [{ relation: 'recipe author', source: 'The PDT Cocktail Book' }],
      sourceType: 'book',
      sourceSlug: 'pdt-cocktail-book',
    });

    expect(findRedundantSourceAttributions([recipe(), redundant], sourceNames)).toEqual([
      redundant,
    ]);
  });

  it('keeps a host credited by name — a different entity than the channel', () => {
    expect(findRedundantSourceAttributions([recipe()], sourceNames)).toEqual([]);
  });

  it('keeps a bar sharing the book source name — a different entity than the book', () => {
    expect(
      findRedundantSourceAttributions(
        [
          recipe({
            attributions: [
              { relation: 'bar', source: "Smuggler's Cove" },
              { relation: 'book', source: 'The Savoy Cocktail Book' },
            ],
            sourceType: 'book',
            sourceSlug: 'smugglers-cove',
          }),
        ],
        sourceNames,
      ),
    ).toEqual([]);
  });
});

describe('findDuplicateBookCredits', () => {
  it('flags a book credited both as a ref and as an attribution', () => {
    expect(
      findDuplicateBookCredits([
        recipe({
          attributions: [{ relation: 'book', source: "The Gentleman's Companion" }],
          refs: [{ type: 'book', title: "The Gentleman's Companion" }],
        }),
      ]),
    ).toEqual([{ file: recipe().file, name: "The Gentleman's Companion" }]);
  });

  it('keeps the book ref to the recipe own source — it carries the page number', () => {
    expect(
      findDuplicateBookCredits([
        recipe({
          sourceType: 'book',
          sourceSlug: 'pdt-cocktail-book',
          attributions: [{ relation: 'book', source: 'The PDT Cocktail Book' }],
          refs: [{ type: 'book', title: 'pdt-cocktail-book' }],
        }),
      ]),
    ).toEqual([]);
  });

  it('ignores unrelated refs and attributions', () => {
    expect(
      findDuplicateBookCredits([
        recipe({
          attributions: [{ relation: 'book', source: 'The Savoy Cocktail Book' }],
          refs: [{ type: 'youtube', title: undefined }],
        }),
      ]),
    ).toEqual([]);
  });
});
