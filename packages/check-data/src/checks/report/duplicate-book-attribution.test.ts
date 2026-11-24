import { describe, expect, it } from 'vitest';
import {
  type BookCreditEntry,
  findDuplicateBookCredits,
  findRedundantBookAttributions,
} from './duplicate-book-attribution.ts';

const sourceNames = new Map([
  ['youtube-channel/make-and-drink', 'Make and Drink'],
  ['youtube-channel/anders-erickson', 'Anders Erickson'],
  ['book/pdt-cocktail-book', 'The PDT Cocktail Book'],
  ['book/smugglers-cove', "Smuggler's Cove"],
]);

function recipe(overrides: Partial<BookCreditEntry> = {}): BookCreditEntry {
  return {
    file: 'data/recipes/youtube-channel/make-and-drink/boat-days.json',
    sourceType: 'youtube-channel',
    sourceSlug: 'make-and-drink',
    attributions: [{ relation: 'recipe author', source: 'Derek Cole' }],
    refs: [],
    ...overrides,
  };
}

describe('findRedundantBookAttributions', () => {
  it('flags a book attribution crediting the recipe own book', () => {
    expect(
      findRedundantBookAttributions(
        [
          recipe({
            file: 'data/recipes/book/pdt-cocktail-book/bentons-old-fashioned.json',
            sourceType: 'book',
            sourceSlug: 'pdt-cocktail-book',
            attributions: [{ relation: 'book', source: 'The PDT Cocktail Book' }],
          }),
        ],
        sourceNames,
      ),
    ).toEqual([
      {
        file: 'data/recipes/book/pdt-cocktail-book/bentons-old-fashioned.json',
        name: 'The PDT Cocktail Book',
      },
    ]);
  });

  it('keeps a book attribution to another book — where the recipe was documented', () => {
    expect(
      findRedundantBookAttributions(
        [
          recipe({
            sourceType: 'book',
            sourceSlug: 'smugglers-cove',
            attributions: [{ relation: 'book', source: 'The Savoy Cocktail Book' }],
          }),
        ],
        sourceNames,
      ),
    ).toEqual([]);
  });

  it('keeps a channel host credited by name — a person, not the channel', () => {
    expect(
      findRedundantBookAttributions(
        [
          recipe({
            file: 'data/recipes/youtube-channel/anders-erickson/aviation.json',
            sourceSlug: 'anders-erickson',
            attributions: [{ relation: 'adapted by', source: 'Anders Erickson' }],
          }),
        ],
        sourceNames,
      ),
    ).toEqual([]);
  });

  it('keeps a bar sharing the book source name — a different entity than the book', () => {
    expect(
      findRedundantBookAttributions(
        [
          recipe({
            sourceType: 'book',
            sourceSlug: 'smugglers-cove',
            attributions: [{ relation: 'bar', source: "Smuggler's Cove" }],
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

  it('ignores book credits that appear in only one shape', () => {
    expect(
      findDuplicateBookCredits([
        recipe({
          attributions: [{ relation: 'book', source: 'The Savoy Cocktail Book' }],
          refs: [],
        }),
      ]),
    ).toEqual([]);
  });
});
