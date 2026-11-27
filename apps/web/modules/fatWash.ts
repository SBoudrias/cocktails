import type { FatWashMethod, RecipeIngredient, TechniqueFatWash } from '@cocktails/data';
import { match } from 'ts-pattern';

/**
 * Canonical fats offered in the fat-wash calculator dropdown, sorted
 * alphabetically with the catch-all "Other fat" last.
 */
export const FAT_TYPES = [
  'Avocado oil',
  'Bacon fat',
  'Brown butter',
  'Butter',
  'Cacao butter',
  'Coconut oil',
  'Sesame oil',
  'Other fat',
] as const;

export const DEFAULT_FAT_TYPE = 'Butter';

/** Published starting percentages (fat volume as % of spirit volume):
 * avocado oil 32% (Tiki: Modern Tropical Cocktails), bacon fat 6% (PDT),
 * butter/brown butter 15% (Educated Barfly), cacao butter 10% and sesame
 * oil 1% (Truffles on the Rocks), coconut oil 25% (Tropical Standard). */
const DEFAULT_PERCENTAGE_BY_FAT: Record<string, number> = {
  'Avocado oil': 32,
  'Bacon fat': 6,
  'Brown butter': 15,
  Butter: 15,
  'Cacao butter': 10,
  'Coconut oil': 25,
  'Sesame oil': 1,
  'Other fat': 10,
};

const MELTABLE_FATS = new Set(['butter', 'brown butter', 'cacao butter']);
const WARMABLE_FATS = new Set(['coconut oil', 'bacon fat']);

export function parseFatWashPercentage(
  raw: string | null | undefined,
): number | undefined {
  if (!raw) return undefined;

  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0 || value >= 100) {
    return undefined;
  }

  return value;
}

/** The default fat percentage for a fat, falling back to Other fat's 10%
 * for unlisted fats (coffee oil, szechuan oil, etc.). */
export function getDefaultFatWashPercentage(fatType: string): number {
  return DEFAULT_PERCENTAGE_BY_FAT[fatType] ?? DEFAULT_PERCENTAGE_BY_FAT['Other fat']!;
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

export function parseFatWashMethod(
  rawMethod: string | null | undefined,
): FatWashMethod | undefined {
  return match(rawMethod)
    .with('room-temp', 'sous-vide', (method) => method)
    .otherwise(() => undefined);
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
  spiritName,
  method,
  durationMinutes,
  temperatureC,
}: {
  fatType: string;
  /** Calculated fat amount phrase for the calculator (e.g. "115 ml of butter"). */
  fatAmount?: string;
  /** Fat percentage for recipe pages where no batch volume is selected. */
  fatPercentage?: number;
  /** Specific ingredient name on a recipe page; omitted on the calculator. */
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

  const combineStep = match(method)
    .with('sous-vide', () => {
      if (fatAmount) {
        return `Seal ${fatAmount} with the spirit in a sous-vide bag.`;
      }
      const fatSpec =
        fatPercentage != null ? `${fatPercentage}% ${fatDisplayName}` : fatDisplayName;
      return `Seal ${spiritName ?? 'the spirit'} with ${fatSpec} in a sous-vide bag.`;
    })
    .with('room-temp', () => {
      if (fatAmount) {
        return `Combine ${fatAmount} with the spirit in a sealed container.`;
      }
      const fatSpec =
        fatPercentage != null ? `${fatPercentage}% ${fatDisplayName}` : fatDisplayName;
      return `Combine ${spiritName ?? 'the spirit'} with ${fatSpec} in a sealed container.`;
    })
    .exhaustive();

  const infuseStep = match(method)
    .with('sous-vide', () => {
      if (temperatureC != null && durationMinutes != null) {
        return `Cook sous-vide at ${formatTemperatureC(temperatureC)} for ${formatDurationMinutes(durationMinutes)}.`;
      }
      if (temperatureC != null) {
        return `Cook sous-vide at ${formatTemperatureC(temperatureC)} for 1 to 2 hours.`;
      }
      if (durationMinutes != null) {
        return `Cook sous-vide at 65°C (149°F), or as instructed, for ${formatDurationMinutes(durationMinutes)}.`;
      }
      return 'Cook sous-vide at 65°C (149°F), or as instructed, for 1 to 2 hours.';
    })
    .with('room-temp', () =>
      durationMinutes != null
        ? `Infuse at room temperature for ${formatDurationMinutes(durationMinutes)}. Stir the mixture from time to time or use a magnetic stirrer.`
        : 'Infuse at room temperature for 4 hours. Stir the mixture from time to time or use a magnetic stirrer.',
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
