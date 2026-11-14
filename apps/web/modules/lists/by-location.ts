import { compareByName } from './by-name';

export const UNKNOWN_CITY = 'Unknown';

/**
 * Extracts the city from a bar location ('Brooklyn, NY' -> 'Brooklyn').
 * Bars without a location group under 'Unknown'.
 */
export function getBarCity(bar: { location?: string }): string {
  const city = bar.location?.split(',')[0]?.trim();
  return city || UNKNOWN_CITY;
}

/**
 * Create a list config grouping bars by city. Cities are ordered by bar
 * count (descending), ties alphabetically, 'Unknown' last. Bars within a
 * city keep the alphabetical order of the A-Z list.
 */
export function createByLocationListConfig<T extends { name: string; location?: string }>(
  bars: T[],
) {
  const barsPerCity = new Map<string, number>();
  for (const bar of bars) {
    const city = getBarCity(bar);
    barsPerCity.set(city, (barsPerCity.get(city) ?? 0) + 1);
  }

  return {
    groupBy: getBarCity,
    sortItemBy: compareByName,
    sortHeaderBy: (cityA: string, cityB: string): number => {
      if (cityA === UNKNOWN_CITY) return 1;
      if (cityB === UNKNOWN_CITY) return -1;
      const countDiff = (barsPerCity.get(cityB) ?? 0) - (barsPerCity.get(cityA) ?? 0);
      return countDiff !== 0 ? countDiff : cityA.localeCompare(cityB);
    },
  };
}
