import { describe, expect, it } from 'vitest';
import { findInertSubstitutableFlags } from './substitutable-categories.ts';

const cat = (name: string, substitutable?: boolean, parents?: string[]) => ({
  name,
  categoryType: 'spirit',
  ...(substitutable !== undefined ? { substitutable } : {}),
  ...(parents ? { parents } : {}),
});

describe('findInertSubstitutableFlags', () => {
  it('keeps a flag on a parent with two or more children', () => {
    expect(
      findInertSubstitutableFlags([
        cat('Vodka', false),
        cat('Chocolate vodka', undefined, ['Vodka']),
        cat('Citrus vodka', undefined, ['Vodka']),
      ]),
    ).toEqual([]);
  });

  it('flags a non-substituting category with a single child', () => {
    const lone = cat('Brandy (grapes)', false);
    const flagless = [cat('Armagnac', undefined, ['Brandy (grapes)'])];

    expect(findInertSubstitutableFlags([lone, ...flagless])).toEqual([lone]);
  });

  it('flags a non-substituting category with no children', () => {
    const orphan = cat('Pisco', false);
    expect(findInertSubstitutableFlags([orphan, cat('Grappa')])).toEqual([orphan]);
  });

  it('ignores substitutable categories entirely', () => {
    expect(
      findInertSubstitutableFlags([cat('Gin', true), cat('Rum', undefined)]),
    ).toEqual([]);
  });
});
