import { areSimilarNames } from './name-similarity.ts';

/**
 * Ingredient names often differ only by an age statement or vintage
 * ("El Dorado 15 Year" vs "El Dorado 5 Year", "Zacapa 23" vs "Zacapa XO").
 * Those are distinct products, not misspellings, so digits are stripped
 * before comparing.
 */
function stripDigits(name: string): string {
  return name.toLowerCase().replace(/\d+/g, '').trim();
}

export interface SimilarIngredientPair {
  a: string;
  b: string;
}

/**
 * Find ingredient name pairs that are close enough to be possible
 * misspellings of the same ingredient.
 *
 * Levenshtein distance <= 2 requires the two names to have lengths within 2
 * of each other, so names are bucketed by their digit-stripped length to
 * avoid an O(n²) scan over every pair.
 */
export function findSimilarIngredientPairs(
  names: readonly string[],
): SimilarIngredientPair[] {
  const stripped = names.map(stripDigits);

  const buckets = new Map<number, number[]>();
  stripped.forEach((name, i) => {
    const length = name.length;
    const bucket = buckets.get(length) ?? [];
    bucket.push(i);
    buckets.set(length, bucket);
  });

  const lengths = Array.from(buckets.keys()).toSorted((a, b) => a - b);
  const pairs: SimilarIngredientPair[] = [];

  for (const [i, lenA] of lengths.entries()) {
    for (const lenB of lengths.slice(i)) {
      if (lenB - lenA > 2) break;
      const bucketA = buckets.get(lenA)!;
      const bucketB = buckets.get(lenB)!;
      for (const a of bucketA) {
        for (const b of bucketB) {
          // Within the same bucket each pair is visited twice; skip the
          // reverse ordering. Across different buckets each pair is visited
          // once, so no index guard applies.
          if (lenA === lenB && a >= b) continue;
          if (areSimilarNames(stripped[a]!, stripped[b]!)) {
            pairs.push({ a: names[a]!, b: names[b]! });
          }
        }
      }
    }
  }

  return pairs;
}
