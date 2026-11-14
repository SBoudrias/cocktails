import { compareByName } from './by-name';

export const UNKNOWN_CITY = 'Unknown';

/**
 * Extracts the city from a bar location. The last comma segment is the
 * state/country ('Brooklyn, NY', 'Paris, France'), so the city is the segment
 * before it ('Disneyland, Anaheim, CA' -> 'Anaheim'). Locations without a
 * comma are their own city ('Singapore'); bars without a location group
 * under 'Unknown'.
 */
export function getBarCity(bar: { location?: string }): string {
  const segments = bar.location
    ?.split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const city =
    segments && segments.length > 1 ? segments[segments.length - 2] : segments?.[0];
  return city || UNKNOWN_CITY;
}

/**
 * Create a list config grouping bars by city. Cities are ordered
 * alphabetically, 'Unknown' last. Bars within a city keep the alphabetical
 * order of the A-Z list.
 */
export function createByLocationListConfig<
  T extends { name: string; location?: string },
>() {
  return {
    groupBy: getBarCity,
    sortItemBy: compareByName,
    sortHeaderBy: (cityA: string, cityB: string): number => {
      if (cityA === UNKNOWN_CITY) return 1;
      if (cityB === UNKNOWN_CITY) return -1;
      return cityA.localeCompare(cityB);
    },
  };
}
