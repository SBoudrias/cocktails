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
