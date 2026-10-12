import type { Recipe } from '@cocktails/data';

const ETC = 'Etc';

/**
 * Build the index-bar domain for chapter grouping: chapter order numbers
 * (`01`..`NN`, from `chapter.order`), with `Etc` always last.
 * Returns the ordered index list and a chapter-name -> index lookup.
 */
export function createChapterIndexMap(recipes: Recipe[]) {
  const orders = new Set<number>();
  let hasEtc = false;

  for (const recipe of recipes) {
    if (recipe.chapter) {
      orders.add(recipe.chapter.order);
    } else {
      hasEtc = true;
    }
  }

  const sortedOrders = [...orders].toSorted((a, b) => a - b);
  const toIndex = (order: number) => order.toString().padStart(2, '0');

  const indexes = sortedOrders.map(toIndex);
  const headerIndex = new Map<string, string>();

  for (const recipe of recipes) {
    const { chapter } = recipe;
    if (chapter && !headerIndex.has(chapter.name)) {
      headerIndex.set(chapter.name, toIndex(chapter.order));
    }
  }

  if (hasEtc) {
    // Etc sorts after every real chapter, so its number follows the last order
    indexes.push(toIndex((sortedOrders.at(-1) ?? 0) + 1));
    headerIndex.set(ETC, indexes.at(-1) ?? '');
  }

  return {
    indexes,
    headerIndex,
  };
}
