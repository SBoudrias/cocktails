import type { FatWashMethod, RecipeIngredient, TechniqueFatWash } from '@cocktails/data';
import {
  createLoader,
  createParser,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { match } from 'ts-pattern';

/** Published starting percentages (fat volume as % of spirit volume), sorted
 * alphabetically with the catch-all "Other fat" last:
 * avocado oil 32% (Tiki: Modern Tropical Cocktails), bacon fat 6% (PDT),
 * butter/brown butter 15% (Educated Barfly), cacao butter 10% and sesame
 * oil 1% (Truffles on the Rocks), coconut oil 25% (Tropical Standard). */
const DEFAULT_PERCENTAGE_BY_FAT = {
  'Avocado oil': 32,
  'Bacon fat': 6,
  'Brown butter': 15,
  Butter: 15,
  'Cacao butter': 10,
  'Coconut oil': 25,
  'Sesame oil': 1,
  'Other fat': 10,
} as const;

export const FAT_TYPES: readonly string[] = Object.keys(DEFAULT_PERCENTAGE_BY_FAT);

const DEFAULT_FAT_TYPE = 'Butter';

const FAT_WASH_METHODS: readonly FatWashMethod[] = ['room-temp', 'sous-vide'];
const MELTABLE_FATS = new Set(['butter', 'brown butter', 'cacao butter']);
const WARMABLE_FATS = new Set(['coconut oil', 'bacon fat']);

const DEFAULT_ROOM_TEMP_DURATION_MINUTES = 240;
const DEFAULT_SOUS_VIDE_TEMP = '65°C (149°F), or as instructed,';
const DEFAULT_SOUS_VIDE_DURATION = '1 to 2 hours';

function parseAsNumberInRange(
  min: number,
  max: number,
  { inclusive = false, integer = false } = {},
) {
  return createParser<number>({
    parse: (raw) => {
      const value = Number(raw.trim());
      if (!Number.isFinite(value)) return null;
      if (integer && !Number.isInteger(value)) return null;
      const inRange = inclusive
        ? value >= min && value <= max
        : value > min && value < max;
      return inRange ? value : null;
    },
    serialize: String,
  });
}

const loadFatWashSearchParams = createLoader({
  fat: parseAsString,
  method: parseAsStringLiteral(FAT_WASH_METHODS).withDefault('room-temp'),
  percentage: parseAsNumberInRange(0, 100),
  duration: parseAsNumberInRange(1, Number.POSITIVE_INFINITY, {
    inclusive: true,
    integer: true,
  }),
  temp: parseAsNumberInRange(30, 100, { inclusive: true }),
});

/** Validates and normalizes the fat-wash calculator's URL query parameters
 * against one schema, falling back to safe defaults for missing or invalid values. */
export function parseFatWashSearchParams(searchParams: { toString(): string } | string) {
  const parsed = loadFatWashSearchParams(
    typeof searchParams === 'string' ? searchParams : searchParams.toString(),
  );
  const { fatType, displayName } = normalizeFatType(parsed.fat);

  return {
    fatType,
    displayName,
    method: parsed.method,
    percentage: parsed.percentage ?? undefined,
    durationMinutes: parsed.duration ?? undefined,
    temperatureC: parsed.temp ?? undefined,
  };
}

function isKnownFatType(
  fatType: string,
): fatType is keyof typeof DEFAULT_PERCENTAGE_BY_FAT {
  return Object.hasOwn(DEFAULT_PERCENTAGE_BY_FAT, fatType);
}

/** The default fat percentage for a fat, falling back to Other fat's 10%
 * for unlisted fats (coffee oil, szechuan oil, etc.). */
export function getDefaultFatWashPercentage(fatType: string): number {
  return isKnownFatType(fatType)
    ? DEFAULT_PERCENTAGE_BY_FAT[fatType]
    : DEFAULT_PERCENTAGE_BY_FAT['Other fat'];
}

/** Dropdown options sorted alphabetically, keeping "Other fat" last even when
 * a custom fat from a recipe URL is added. */
export function getFatTypeOptions(customFatLabel?: string): string[] {
  const namedFats = FAT_TYPES.filter((type) => type !== 'Other fat');
  const allNamed: string[] = customFatLabel ? [...namedFats, customFatLabel] : namedFats;

  return [...allNamed.toSorted((a, b) => a.localeCompare(b)), 'Other fat'];
}

/** Matches a raw fat string to a canonical dropdown label when one exists, or
 * formats a custom fat with an initial capital for the select while preserving
 * its prose casing (so "coffee oil" reads lowercase in prose, while proper
 * nouns like "Baileys" keep their capital). */
export function normalizeFatType(rawFat: string | null | undefined): {
  fatType: string;
  displayName: string;
} {
  const cleaned = rawFat?.trim().replaceAll(/\s+/g, ' ');
  if (!cleaned) {
    return { fatType: DEFAULT_FAT_TYPE, displayName: DEFAULT_FAT_TYPE.toLowerCase() };
  }

  const canonical = FAT_TYPES.find(
    (type) => type.toLowerCase() === cleaned.toLowerCase(),
  );
  if (canonical) {
    return { fatType: canonical, displayName: canonical.toLowerCase() };
  }

  const isAllLower = cleaned === cleaned.toLowerCase();
  return {
    fatType: isAllLower
      ? `${cleaned.slice(0, 1).toUpperCase()}${cleaned.slice(1)}`
      : cleaned,
    displayName: cleaned,
  };
}

export function formatDurationMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';

  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} ${rounded === 1 ? 'minute' : 'minutes'}`;
  }

  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  const hoursText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

  if (remainingMinutes === 0) {
    return hoursText;
  }

  return `${hoursText} ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
}

export function formatTemperatureC(celsius: number): string {
  const fahrenheit = Math.round((celsius * 9) / 5 + 32);
  return `${celsius}°C (${fahrenheit}°F)`;
}

/** Extracts every fat-wash technique paired with its ingredient. */
export function getFatWashIngredients(
  ingredients: readonly RecipeIngredient[],
): Array<{ ingredient: RecipeIngredient; fatWash: TechniqueFatWash }> {
  const results: Array<{ ingredient: RecipeIngredient; fatWash: TechniqueFatWash }> = [];

  for (const ingredient of ingredients) {
    const techniques =
      ingredient.technique == null
        ? []
        : Array.isArray(ingredient.technique)
          ? ingredient.technique
          : [ingredient.technique];

    for (const technique of techniques) {
      if (technique.technique === 'fat-wash') {
        results.push({ ingredient, fatWash: technique });
      }
    }
  }

  return results;
}

/**
 * Step-by-step fat-wash instructions shared by recipe pages and the fat-wash
 * calculator. Every wash either infuses at room temperature or cooks
 * sous-vide, then rests undisturbed until the fat separates before freezing
 * and straining off the solid cap.
 */
export function buildFatWashSteps({
  fatType,
  fatAmount,
  fatPercentage,
  spiritName = 'the spirit',
  method,
  durationMinutes,
  temperatureC,
}: {
  fatType: string;
  /** Calculated fat amount phrase for the calculator (e.g. "115 ml of butter"). */
  fatAmount?: string;
  /** Fat percentage for recipe pages where no batch volume is selected. */
  fatPercentage?: number;
  /** Specific ingredient name on a recipe page; defaults to "the spirit" on the calculator. */
  spiritName?: string;
  method: FatWashMethod;
  durationMinutes?: number;
  temperatureC?: number;
}): string[] {
  const fatLower = fatType.toLowerCase();
  const fatDisplayName = normalizeFatType(fatType).displayName;

  const prepStep = MELTABLE_FATS.has(fatLower)
    ? [`Melt the ${fatLower} gently.`]
    : WARMABLE_FATS.has(fatLower)
      ? [`Warm the ${fatLower} until liquid.`]
      : [];

  const fatSpec =
    fatPercentage != null ? `${fatPercentage}% ${fatDisplayName}` : fatDisplayName;
  const mixture = fatAmount
    ? `${fatAmount} with ${spiritName}`
    : `${spiritName} with ${fatSpec}`;

  const combineStep = match(method)
    .with('sous-vide', () => `Seal ${mixture} in a sous-vide bag.`)
    .with('room-temp', () => `Combine ${mixture} in a sealed container.`)
    .exhaustive();

  const duration =
    durationMinutes != null ? formatDurationMinutes(durationMinutes) : undefined;
  const temperature = temperatureC != null ? formatTemperatureC(temperatureC) : undefined;

  const infuseStep = match(method)
    .with(
      'sous-vide',
      () =>
        `Cook sous-vide at ${temperature ?? DEFAULT_SOUS_VIDE_TEMP} for ${duration ?? DEFAULT_SOUS_VIDE_DURATION}.`,
    )
    .with(
      'room-temp',
      () =>
        `Infuse at room temperature for ${duration ?? formatDurationMinutes(DEFAULT_ROOM_TEMP_DURATION_MINUTES)}. Stir the mixture from time to time or use a magnetic stirrer.`,
    )
    .exhaustive();

  return [
    ...prepStep,
    combineStep,
    infuseStep,
    'Let sit undisturbed until the fat separates, then freeze until solid.',
    'Remove the solid fat cap and strain through a coffee filter.',
  ];
}
