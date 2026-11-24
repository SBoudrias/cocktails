import { getAuthor } from '@cocktails/data/authors';
import { getCategory } from '@cocktails/data/categories';
import { getRecipe } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import {
  buildCatalog,
  getAuthorSourcePicker,
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

// Real recipes for the author pages' secondary line: Anders' channel
// carries his originals and his adaptations (with the origin named by its
// creator, by a book, or not at all), and other books carry originals of
// their own authors and bare adaptations in sources their author is behind.
const [aLittleThymeOff, aviation, pagoPago, byTheToe, hotTigersMilk, fogCutterRemix] =
  await Promise.all([
    getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'a-little-thyme-off'),
    getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'aviation'),
    getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'pago-pago'),
    getRecipe(
      { type: 'book', slug: 'minimalist-tiki' },
      'by-the-toe',
      '04_Minimalist Tiki Classic Thirty... Modern Take',
    ),
    getRecipe({ type: 'book', slug: 'sippin-safari' }, 'hot-tigers-milk'),
    getRecipe(
      { type: 'book', slug: 'tiki-modern-tropical-cocktails' },
      'fog-cutter-the-brother-cleve-remix',
      '09_Bonus',
    ),
  ]);

const [anders, brianMaxwell, beachbumBerry, brotherCleve] = await Promise.all([
  getAuthor('anders-erickson'),
  getAuthor('brian-maxwell'),
  getAuthor('jeff-beachbum-berry'),
  getAuthor('brother-cleve'),
]);
if (!anders || !brianMaxwell || !beachbumBerry || !brotherCleve) {
  throw new Error('an author fixture entity is missing');
}

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
  // Building the catalog walks every catalog-driven page; coverage
  // instrumentation roughly doubles that, past the 10s default.
  it('covers every page that lists recipes', { timeout: 60_000 }, async () => {
    const catalog: {
      cards: Record<string, [string, string]>;
      lists: Record<string, [string, unknown][]>;
    } = JSON.parse(await getSerializedCatalog());

    // The giants are in, with their full lists.
    expect((catalog.lists['category/rum'] ?? []).length).toBeGreaterThan(100);
    expect((catalog.lists['ingredient/juice/lime-juice'] ?? []).length).toBeGreaterThan(
      100,
    );
    expect((catalog.lists['list/authors/tyson-buhler'] ?? []).length).toBeGreaterThan(
      100,
    );
    expect(
      (catalog.lists['list/bars/death-and-co-new-york-ny'] ?? []).length,
    ).toBeGreaterThan(500);

    // The non-alcoholic style list is in too, with no per-recipe quantity.
    expect((catalog.lists['list/style/non-alcoholic'] ?? []).length).toBeGreaterThan(10);
    for (const [, quantity] of catalog.lists['list/style/non-alcoholic'] ?? []) {
      expect(quantity).toBeNull();
    }

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
  });
});

describe('getAuthorSourcePicker', () => {
  it('labels an original of the author as such, with its source only when not their own', () => {
    const pick = getAuthorSourcePicker(anders);

    // An original on the author's own channel: the page already implies
    // the channel, so the line carries the relationship alone.
    expect(pick(aLittleThymeOff)).toBe('Original');
  });

  it('labels an adaptation with its origin — the original creator first', () => {
    const pick = getAuthorSourcePicker(anders);

    // The Aviation's original creator is credited alongside Anders'
    // adaptation, so the line names him, not the channel.
    expect(pick(aviation)).toBe('Adaptation · Hugo Ensslin');
  });

  it('falls back to the documenting book when the creator is not credited', () => {
    const pick = getAuthorSourcePicker(anders);

    // The Pago Pago adaptation carries no creator credit, only the book
    // attribution of the recipe it adapts.
    expect(pick(pagoPago)).toBe('Adaptation · The How and When');
  });

  it('drops the source of a bare adaptation living in the author own source', () => {
    const pick = getAuthorSourcePicker(beachbumBerry);

    // Hot Tiger's Milk sits in Sippin' Safari — Beachbum's own book, from
    // his entity's sources refs — and names no origin, so nothing else
    // can be said beyond the relationship.
    expect(pick(hotTigersMilk)).toBe('Adaptation');
  });

  it('names the source when the relationship alone would not place the recipe', () => {
    const pick = getAuthorSourcePicker(brotherCleve);

    // The remix lives in a book Brother Cleve is not behind and names no
    // origin, so the line falls back to the source's title.
    expect(pick(fogCutterRemix)).toBe('Adaptation · Tiki: Modern Tropical Cocktails');
  });

  it('names the source of an original published in another book', () => {
    const pick = getAuthorSourcePicker(brianMaxwell);

    // By the Toe is Brian Maxwell's original, but Minimalist Tiki is not
    // his own source (no refs on his entity), so the line carries it.
    expect(pick(byTheToe)).toBe('Original · Minimalist Tiki');
  });
});

describe('buildCatalog with a per-list source', () => {
  it('carries the picked line as a third element, only on lists that pick one', () => {
    const pick = () => undefined;
    const catalog = buildCatalog([
      {
        key: 'list/authors/anders-erickson',
        recipes: [aLittleThymeOff, aviation],
        pickQuantity: pick,
        pickSource: getAuthorSourcePicker(anders),
      },
      { key: 'list/bars/lost-lake', recipes: [fogCutter], pickQuantity: pick },
    ]);

    // The author entries carry their page's secondary line; the bar
    // entries stay two-element, as every list without a picker does.
    expect(catalog.lists['list/authors/anders-erickson']).toEqual([
      [getRecipeUrl(aLittleThymeOff), null, 'Original'],
      [getRecipeUrl(aviation), null, 'Adaptation · Hugo Ensslin'],
    ]);
    expect(catalog.lists['list/bars/lost-lake']).toEqual([
      [getRecipeUrl(fogCutter), null],
    ]);

    // The cards still carry the plain source — the override is per-list,
    // never folded into the shared card.
    expect(catalog.cards[getRecipeUrl(aviation)]).toEqual([
      'Aviation',
      'Anders Erickson',
    ]);
  });
});
