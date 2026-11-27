import type { RecipeIngredient } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import {
  buildFatWashSteps,
  FAT_TYPES,
  formatDurationMinutes,
  formatTemperatureC,
  getDefaultFatWashPercentage,
  getFatTypeOptions,
  getFatWashIngredients,
  normalizeFatType,
  parseFatWashMethod,
  parseFatWashPercentage,
} from './fatWash';

describe('FAT_TYPES & getFatTypeOptions', () => {
  it('keeps canonical fats alphabetically sorted with Other fat last', () => {
    const namedFats = FAT_TYPES.slice(0, -1);
    expect(FAT_TYPES.at(-1)).toBe('Other fat');
    expect(namedFats).toEqual(namedFats.toSorted((a, b) => a.localeCompare(b)));
  });

  it('sorts a custom fat alphabetically while keeping Other fat last', () => {
    const options = getFatTypeOptions('Coffee oil');
    expect(options.at(-1)).toBe('Other fat');
    expect(options.indexOf('Coffee oil')).toBeGreaterThan(options.indexOf('Coconut oil'));
    expect(options.indexOf('Coffee oil')).toBeLessThan(options.indexOf('Sesame oil'));
  });
});

describe('parseFatWashPercentage', () => {
  it('parses valid percentages between 0 and 100', () => {
    expect(parseFatWashPercentage('6')).toBe(6);
    expect(parseFatWashPercentage(' 12.5 ')).toBe(12.5);
    expect(parseFatWashPercentage('25')).toBe(25);
  });

  it('rejects empty, malformed, or out-of-range percentages', () => {
    expect(parseFatWashPercentage(undefined)).toBeUndefined();
    expect(parseFatWashPercentage('')).toBeUndefined();
    expect(parseFatWashPercentage('0')).toBeUndefined();
    expect(parseFatWashPercentage('-5')).toBeUndefined();
    expect(parseFatWashPercentage('100')).toBeUndefined();
    expect(parseFatWashPercentage('1:10')).toBeUndefined();
  });
});

describe('getDefaultFatWashPercentage', () => {
  it('returns published starting percentages for known fats and 10% otherwise', () => {
    expect(getDefaultFatWashPercentage('Avocado oil')).toBe(32);
    expect(getDefaultFatWashPercentage('Bacon fat')).toBe(6);
    expect(getDefaultFatWashPercentage('Brown butter')).toBe(15);
    expect(getDefaultFatWashPercentage('Butter')).toBe(15);
    expect(getDefaultFatWashPercentage('Cacao butter')).toBe(10);
    expect(getDefaultFatWashPercentage('Coconut oil')).toBe(25);
    expect(getDefaultFatWashPercentage('Sesame oil')).toBe(1);
    expect(getDefaultFatWashPercentage('Coffee oil')).toBe(10);
  });
});

describe('normalizeFatType', () => {
  it('defaults to Butter when empty and matches canonical fats case-insensitively', () => {
    expect(normalizeFatType(null)).toEqual({
      fatType: 'Butter',
      displayName: 'butter',
    });
    expect(normalizeFatType('  brown   butter ')).toEqual({
      fatType: 'Brown butter',
      displayName: 'brown butter',
    });
  });

  it('keeps unlisted fats capitalized in the select while preserving prose casing', () => {
    expect(normalizeFatType('coffee oil')).toEqual({
      fatType: 'Coffee oil',
      displayName: 'coffee oil',
    });
    expect(normalizeFatType('Baileys')).toEqual({
      fatType: 'Baileys',
      displayName: 'Baileys',
    });
  });
});

describe('parseFatWashMethod', () => {
  it('accepts room-temp and sous-vide and ignores unknown strings', () => {
    expect(parseFatWashMethod('room-temp')).toBe('room-temp');
    expect(parseFatWashMethod('sous-vide')).toBe('sous-vide');
    expect(parseFatWashMethod('freezer')).toBeUndefined();
    expect(parseFatWashMethod('cold')).toBeUndefined();
    expect(parseFatWashMethod(null)).toBeUndefined();
  });
});

describe('formatDurationMinutes', () => {
  it('formats minutes, whole hours, and mixed hours/minutes cleanly', () => {
    expect(formatDurationMinutes(1)).toBe('1 minute');
    expect(formatDurationMinutes(5)).toBe('5 minutes');
    expect(formatDurationMinutes(60)).toBe('1 hour');
    expect(formatDurationMinutes(90)).toBe('1 hour 30 minutes');
    expect(formatDurationMinutes(240)).toBe('4 hours');
    expect(formatDurationMinutes(0)).toBe('');
  });
});

describe('formatTemperatureC', () => {
  it('formats Celsius with rounded Fahrenheit equivalent', () => {
    expect(formatTemperatureC(65)).toBe('65°C (149°F)');
    expect(formatTemperatureC(60)).toBe('60°C (140°F)');
  });
});

describe('getFatWashIngredients', () => {
  it('extracts fat-wash techniques from single and stacked technique arrays', () => {
    const ingredients = [
      {
        name: 'Four Roses Bourbon',
        slug: 'four-roses-bourbon',
        type: 'spirit',
        technique: {
          technique: 'fat-wash',
          fat: 'bacon fat',
          method: 'room-temp',
          percentage: 6,
        },
        quantity: { amount: 2, unit: 'oz' },
        categories: [],
        refs: [],
        ingredients: [],
      },
      {
        name: 'Cognac',
        slug: 'cognac',
        type: 'category',
        technique: [
          {
            technique: 'fat-wash',
            fat: 'brown butter',
            method: 'room-temp',
            percentage: 15,
          },
          { technique: 'infusion', agent: 'vanilla pod' },
        ],
        quantity: { amount: 1.5, unit: 'oz' },
        categories: [],
        refs: [],
        ingredients: [],
      },
      {
        name: 'Maple syrup',
        slug: 'maple-syrup',
        type: 'syrup',
        quantity: { amount: 0.25, unit: 'oz' },
        categories: [],
        refs: [],
        ingredients: [],
      },
    ] as RecipeIngredient[];

    const washes = getFatWashIngredients(ingredients);
    expect(
      washes.map(({ ingredient, fatWash }) => [ingredient.name, fatWash.fat]),
    ).toEqual([
      ['Four Roses Bourbon', 'bacon fat'],
      ['Cognac', 'brown butter'],
    ]);
  });
});

describe('buildFatWashSteps', () => {
  it('builds room-temp steps with fat prep, separation, freezing, and straining', () => {
    expect(
      buildFatWashSteps({
        fatType: 'Butter',
        fatAmount: '115 ml of butter',
        method: 'room-temp',
      }),
    ).toEqual([
      'Melt the butter gently.',
      'Combine 115 ml of butter with the spirit in a sealed container.',
      'Infuse at room temperature for 4 hours.',
      'Let sit undisturbed until the fat separates, then freeze until solid.',
      'Remove the solid fat cap and strain through a coffee filter.',
    ]);
  });

  it('builds sous-vide steps with water bath temperature and duration', () => {
    expect(
      buildFatWashSteps({
        fatType: 'cacao butter',
        fatPercentage: 10,
        spiritName: 'Plymouth Gin',
        method: 'sous-vide',
        temperatureC: 65,
        durationMinutes: 60,
      }),
    ).toEqual([
      'Melt the cacao butter gently.',
      'Seal Plymouth Gin with 10% cacao butter in a sous-vide bag.',
      'Cook sous-vide at 65°C (149°F) for 1 hour.',
      'Let sit undisturbed until the fat separates, then freeze until solid.',
      'Remove the solid fat cap and strain through a coffee filter.',
    ]);
  });

  it('omits melting step for liquid oils and warms solid fats like bacon fat', () => {
    const sesameSteps = buildFatWashSteps({
      fatType: 'sesame oil',
      fatPercentage: 1,
      spiritName: 'Gin',
      method: 'room-temp',
    });
    expect(sesameSteps[0]).toBe('Combine Gin with 1% sesame oil in a sealed container.');

    const baconSteps = buildFatWashSteps({
      fatType: 'bacon fat',
      fatPercentage: 6,
      spiritName: 'Four Roses Bourbon',
      method: 'room-temp',
      durationMinutes: 240,
    });
    expect(baconSteps[0]).toBe('Warm the bacon fat until liquid.');
    expect(baconSteps[2]).toBe('Infuse at room temperature for 4 hours.');
  });
});
