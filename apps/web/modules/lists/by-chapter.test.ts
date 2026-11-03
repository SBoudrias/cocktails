import type { Chapter, Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import { toRecipeCards } from '#/modules/recipeCard';
import {
  compareByPage,
  compareChapterHeaders,
  createByChapterListConfig,
  createChapterHeaderComparator,
  getChapterName,
} from './by-chapter';

const recipeFixture: Recipe = {
  name: 'Test',
  slug: 'test',
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  ingredients: [],
  attributions: [],
  refs: [],
  source: {
    type: 'podcast',
    name: 'Test Channel',
    slug: 'test-channel',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
};

const createCard = (name: string, chapter?: Chapter, page?: number) =>
  toRecipeCards([
    {
      ...recipeFixture,
      name,
      slug: name.toLowerCase().replace(/\s/g, '-'),
      chapter,
      refs: page ? [{ type: 'book', title: 'Test Book', page }] : [],
    },
  ])[0]!;

describe('getChapterName', () => {
  it('returns chapter name when present', () => {
    expect(getChapterName(createCard('Test', { order: 1, name: 'Rum Drinks' }))).toBe(
      'Rum Drinks',
    );
    expect(
      getChapterName(createCard('Test', { order: 2, name: 'The History of Tiki' })),
    ).toBe('The History of Tiki');
  });

  it('returns Etc for recipes without chapter', () => {
    expect(getChapterName(createCard('Test'))).toBe('Etc');
  });
});

describe('compareByPage', () => {
  it('sorts recipe cards by page number', () => {
    const card1 = createCard('A', { order: 1, name: 'Rum' }, 10);
    const card2 = createCard('B', { order: 1, name: 'Rum' }, 5);
    const card3 = createCard('C', { order: 1, name: 'Rum' }, 15);

    const sorted = [card1, card2, card3].toSorted(compareByPage);

    expect(sorted.map((c) => c.name)).toEqual(['B', 'A', 'C']);
  });

  it('puts cards without page at end', () => {
    const card1 = createCard('A', { order: 1, name: 'Rum' }, 10);
    const card2 = createCard('B', { order: 1, name: 'Rum' });

    const sorted = [card2, card1].toSorted(compareByPage);

    expect(sorted.map((c) => c.name)).toEqual(['A', 'B']);
  });
});

describe('compareChapterHeaders', () => {
  it('sorts Etc to end', () => {
    expect(compareChapterHeaders('Etc', 'Rum')).toBe(1);
    expect(compareChapterHeaders('Rum', 'Etc')).toBe(-1);
  });

  it('sorts other headers alphabetically', () => {
    expect(compareChapterHeaders('Rum', 'Tiki')).toBeLessThan(0);
    expect(compareChapterHeaders('Tiki', 'Rum')).toBeGreaterThan(0);
  });
});

describe('createChapterHeaderComparator', () => {
  it('sorts chapters by their order', () => {
    const cards = [
      createCard('A', { order: 3, name: 'Chapter Three' }),
      createCard('B', { order: 1, name: 'Chapter One' }),
      createCard('C', { order: 2, name: 'Chapter Two' }),
    ];

    const comparator = createChapterHeaderComparator(cards);

    const headers = ['Chapter Three', 'Chapter One', 'Chapter Two'].toSorted(comparator);
    expect(headers).toEqual(['Chapter One', 'Chapter Two', 'Chapter Three']);
  });

  it('puts Etc at end', () => {
    const cards = [createCard('A', { order: 1, name: 'Rum' }), createCard('B')];

    const comparator = createChapterHeaderComparator(cards);

    expect(comparator('Etc', 'Rum')).toBe(1);
    expect(comparator('Rum', 'Etc')).toBe(-1);
  });
});

describe('createByChapterListConfig', () => {
  it('creates a config with proper grouping and sorting', () => {
    const cards = [
      createCard('Zombie', { order: 1, name: 'Rum' }, 50),
      createCard('Daiquiri', { order: 1, name: 'Rum' }, 10),
      createCard('Mai Tai', { order: 2, name: 'Tiki' }, 30),
    ];

    const config = createByChapterListConfig(cards);

    // Test groupBy
    expect(config.groupBy(cards[0]!)).toBe('Rum');
    expect(config.groupBy(cards[2]!)).toBe('Tiki');

    // Test sortItemBy (by page)
    expect([cards[0]!, cards[1]!].toSorted(config.sortItemBy).map((c) => c.name)).toEqual(
      ['Daiquiri', 'Zombie'],
    );

    // Test sortHeaderBy (by chapter order)
    expect(config.sortHeaderBy('Tiki', 'Rum')).toBeGreaterThan(0);
    expect(config.sortHeaderBy('Rum', 'Tiki')).toBeLessThan(0);
  });
});
