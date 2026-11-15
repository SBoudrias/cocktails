import type { BarLocationUsage } from './bar-locations.ts';

export interface LocationFormatIssue {
  /** The bar credited with the location, for the report message. */
  name: string;
  /** The offending location string, exactly as credited. */
  location: string;
  /** The final comma-separated segment — the region that failed to resolve. */
  region: string;
  /** The 2-letter code to use instead, when the region is a full US state name. */
  suggestedCode?: string;
  /** An example file crediting the location, for the report message. */
  exampleFile: string;
}

// The 50 USPS codes plus DC, with the full state names they replace. A
// location's last comma-separated segment must be one of these codes — never
// the spelled-out state ("Anaheim, California" → "Anaheim, CA").
const US_STATES: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

// Two-letter region codes beyond the USPS set: Canadian provinces and
// territories (British Columbia is already in use), and the UK's established
// "London, UK" form.
const OTHER_REGION_CODES = new Set([
  'AB',
  'BC',
  'MB',
  'NB',
  'NL',
  'NS',
  'NT',
  'NU',
  'ON',
  'PE',
  'QC',
  'SK',
  'YT',
  'UK',
]);

// Non-US locations resolve by country name — a bare country ("Sweden") or the
// final segment of a "City, Country" ("Paris, France"). Extend this list when
// a valid country fails the check; US territories keep their country-style
// names ("San Juan, Puerto Rico"), and Canadian locations use province codes
// instead.
const COUNTRIES = new Set([
  'australia',
  'bahamas',
  'british virgin islands',
  'china',
  'cuba',
  'denmark',
  'france',
  'germany',
  'ireland',
  'italy',
  'japan',
  'malaysia',
  'mexico',
  'netherlands',
  'new zealand',
  'philippines',
  'puerto rico',
  'singapore',
  'spain',
  'sweden',
  'trinidad and tobago',
  'u.s. virgin islands',
  'united kingdom',
  'venezuela',
]);

const REGION_CODES = new Set([...Object.values(US_STATES), ...OTHER_REGION_CODES]);

function normalizeRegion(region: string): string {
  return region.trim().replace(/\.$/, '').replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Find bar locations that don't follow the location convention: the last
 * comma-separated segment must be a two-letter state/province code from the
 * allowlist, or a country name from the allowlist — "City, ST" for US and
 * Canadian bars, "City, Country" elsewhere, a bare country when nothing more
 * is known, and a venue or neighborhood may lead the chain ("Disneyland,
 * Anaheim, CA"). Full state names and unknown regions fail with the code or
 * country to use instead.
 */
export function findInvalidLocationFormats(
  usages: readonly BarLocationUsage[],
): LocationFormatIssue[] {
  const issues = new Map<string, LocationFormatIssue>();

  for (const usage of usages) {
    if (!usage.location) continue;
    if (issues.has(usage.location)) continue;

    const region = usage.location.split(',').at(-1)!.trim();
    if (REGION_CODES.has(region) || COUNTRIES.has(normalizeRegion(region))) continue;

    issues.set(usage.location, {
      name: usage.name,
      location: usage.location,
      region,
      exampleFile: usage.filepath,
      suggestedCode: US_STATES[normalizeRegion(region)],
    });
  }

  return Array.from(issues.values());
}
