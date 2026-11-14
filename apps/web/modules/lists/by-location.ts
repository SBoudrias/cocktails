import { compareByName } from './by-name';

export const UNKNOWN_CITY = 'Unknown';

/**
 * The group label for a bar in city mode: its full location string
 * ('Brooklyn, NY', 'Paris, France'), state or country included. Bars
 * without a location group under 'Unknown'.
 */
export function getBarLocationLabel(bar: { location?: string }): string {
  return bar.location?.trim() || UNKNOWN_CITY;
}

/**
 * List config grouping bars by location. Locations are ordered alphabetically,
 * 'Unknown' last. Bars within a location keep the alphabetical order of the
 * A-Z list.
 */
export const byLocationListConfig = {
  groupBy: getBarLocationLabel,
  sortItemBy: compareByName,
  sortHeaderBy: (locationA: string, locationB: string): number => {
    if (locationA === UNKNOWN_CITY) return 1;
    if (locationB === UNKNOWN_CITY) return -1;
    return locationA.localeCompare(locationB);
  },
};
