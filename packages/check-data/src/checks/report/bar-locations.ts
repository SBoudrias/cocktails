import { normalizeName } from './approved-overlaps.ts';

export interface BarLocationUsage {
  name: string;
  location?: string;
  filepath: string;
}

export interface BarLocationVariant {
  /**
   * The location as first credited, or null when the bar has no location.
   * Names and locations are compared case-insensitively, so casing drift
   * alone doesn't count as an inconsistency.
   */
  location: string | null;
  count: number;
  exampleFile: string;
}

export interface InconsistentBarLocation {
  name: string;
  variants: BarLocationVariant[];
}

/**
 * Find bars credited under the same name with inconsistent locations — two
 * different locations, or the same name with and without a location — across
 * bar entity files and recipe attributions. The same bar name with different
 * locations usually means one venue's location drifted (a missing or
 * mistyped "City, ST"), not genuinely different venues; those are suppressed
 * by the caller via the approved overlaps registry.
 */
export function findInconsistentBarLocations(
  usages: readonly BarLocationUsage[],
): InconsistentBarLocation[] {
  const bars = new Map<
    string,
    { display: string; variants: Map<string, BarLocationVariant> }
  >();

  for (const usage of usages) {
    const nameKey = normalizeName(usage.name);
    let bar = bars.get(nameKey);

    if (!bar) {
      bar = { display: usage.name, variants: new Map() };
      bars.set(nameKey, bar);
    }

    const locationKey = usage.location ? normalizeName(usage.location) : '';
    const variant = bar.variants.get(locationKey);

    if (variant) {
      variant.count += 1;
    } else {
      bar.variants.set(locationKey, {
        location: usage.location ?? null,
        count: 1,
        exampleFile: usage.filepath,
      });
    }
  }

  return Array.from(bars.values())
    .filter((bar) => bar.variants.size > 1)
    .map((bar) => ({ name: bar.display, variants: Array.from(bar.variants.values()) }));
}

export interface SimilarBarNames {
  /** The shorter name, whose distinctive words all appear in the other. */
  shortName: string;
  /** The longer name, one or two words beyond the shorter one. */
  longName: string;
  /** The words the longer name adds — the drift to review. */
  extras: string[];
}

// Words so generic they carry no identity; dropping them before comparing
// keeps "The Zam Zam" and "Zam Zam" a single name, not a similar pair.
const GENERIC_NAME_WORDS = new Set(['the', 'a', 'an', 'and', '&', 'of', 'at']);

function getDistinctiveNameTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/\d+/g, '')
      .split(/[^a-z0-9']+/)
      .filter((word) => word.length > 0 && !GENERIC_NAME_WORDS.has(word)),
  );
}

/**
 * Find bar names that look like the same venue recorded at two precisions —
 * one name's distinctive words all appear inside the other, which adds only
 * one or two of its own ("Disney's Polynesian Resort" inside "…Village
 * Resort", "Caribe Hilton" inside "Caribe Hilton Hotel"). Renames and
 * short-form credits look like this; genuinely different venues rarely do.
 * Same suppression path as the location check: the approved overlaps registry.
 */
export function findSimilarBarNames(
  usages: readonly BarLocationUsage[],
): SimilarBarNames[] {
  const names = new Map<string, string>();
  for (const usage of usages) {
    if (!names.has(normalizeName(usage.name))) {
      names.set(normalizeName(usage.name), usage.name);
    }
  }

  const tokensByName = new Map(
    Array.from(names.entries(), ([key, name]) => [key, getDistinctiveNameTokens(name)]),
  );

  const pairs: SimilarBarNames[] = [];
  const keys = Array.from(names.keys());

  for (const shortKey of keys) {
    for (const longKey of keys) {
      if (shortKey === longKey) continue;

      const shortTokens = tokensByName.get(shortKey)!;
      const longTokens = tokensByName.get(longKey)!;
      if (shortTokens.size === 0) continue;

      const extras = Array.from(longTokens).filter((token) => !shortTokens.has(token));
      const isContained = Array.from(shortTokens).every((token) => longTokens.has(token));

      if (isContained && extras.length > 0 && extras.length <= 2) {
        pairs.push({
          shortName: names.get(shortKey)!,
          longName: names.get(longKey)!,
          extras,
        });
      }
    }
  }

  return pairs;
}
