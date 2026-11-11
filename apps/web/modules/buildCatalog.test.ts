import { getCategory } from '@cocktails/data/categories';
import { getRecipe } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import {
  buildCatalog,
  getCategoryQuantityPicker,
  getIngredientQuantityPicker,
  getSerializedCatalog,
} from './buildCatalog';

// Real recipes: the category picker walks their ingredient tree (child
// categories, bottle categories), which hand-rolled fixtures would have to
// mirror exactly.
const [zombie, fogCutter] = await Promise.all([
  getRecipe({ type: 'book', slug: 'easy-tiki' }, 'zombie', '01_Classic Recipes'),
  getRecipe({ type: 'book', slug: 'easy-tiki' }, 'fog-cutter', '01_Classic Recipes'),
]);

describe('buildCatalog', () => {
  it('keys lists by page and cards by href, with quantities per list', async () => {
    const catalog = buildCatalog([
      {
        key: 'category/rum',
        recipes: [zombie, fogCutter],
        pickQuantity: getCategoryQuantityPicker(await getCategory('rum'), []),
      },
    ]);

    expect(catalog.lists['category/rum']).toHaveLength(2);
    // Every entry pairs with a card the catalog also knows, and carries a
    // quantity or null.
    for (const [href, quantity] of catalog.lists['category/rum'] ?? []) {
      expect(catalog.cards[href]).toBeDefined();
      expect(quantity == null || 'amount' in quantity).toBe(true);
    }
  });

  it('folds a recipe appearing on many lists into one card', () => {
    const pick = getIngredientQuantityPicker({ slug: 'no-quantity-match' });
    const catalog = buildCatalog([
      { key: 'category/rum', recipes: [zombie, fogCutter], pickQuantity: pick },
      { key: 'ingredient/spirit/rum', recipes: [zombie], pickQuantity: pick },
    ]);

    expect(Object.keys(catalog.cards)).toHaveLength(2);
    expect(Object.keys(catalog.lists)).toEqual(['category/rum', 'ingredient/spirit/rum']);
  });

  it('orders keys by code unit, independent of input order', () => {
    const pick = getIngredientQuantityPicker({ slug: 'no-quantity-match' });
    const inputs = [
      { key: 'ingredient/juice/lime-juice', recipes: [zombie], pickQuantity: pick },
      { key: 'category/rum', recipes: [zombie], pickQuantity: pick },
    ];

    const first = JSON.stringify(buildCatalog(inputs));
    const second = JSON.stringify(buildCatalog(inputs.toReversed()));
    expect(Object.keys(JSON.parse(first).lists)).toEqual([
      'category/rum',
      'ingredient/juice/lime-juice',
    ]);
    expect(second).toBe(first);
  });
});

describe('getSerializedCatalog', () => {
  // Building the catalog walks every ingredient and category page; coverage
  // instrumentation roughly doubles that, past the 10s default.
  it(
    'covers every ingredient and category page that lists recipes',
    { timeout: 60_000 },
    async () => {
      const catalog: {
        cards: Record<string, [string, string]>;
        lists: Record<string, [string, unknown][]>;
      } = JSON.parse(await getSerializedCatalog());

      // The giants are in, with their full lists.
      expect((catalog.lists['category/rum'] ?? []).length).toBeGreaterThan(100);
      expect((catalog.lists['ingredient/juice/lime-juice'] ?? []).length).toBeGreaterThan(
        100,
      );

      // Cards are keyed by recipe URLs; every entry's href resolves to a card.
      for (const [href, card] of Object.entries(catalog.cards)) {
        expect(href).toMatch(/^\/recipes\/[^/]+\/[^/]+\/[^/]+$/);
        expect(card).toHaveLength(2);
      }
      for (const entries of Object.values(catalog.lists)) {
        for (const [href] of entries) {
          expect(catalog.cards[href]).toBeDefined();
        }
      }
    },
  );
});
