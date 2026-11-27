'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { FatWashMethod, RecipeIngredient } from '@cocktails/data';
import slugify from '@sindresorhus/slugify';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { match } from 'ts-pattern';
import { CalculatorInstructions } from '#/components/calculators/CalculatorInstructions';
import IngredientList from '#/components/IngredientList';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
import { ListSubheader } from '#/components/ui/list';
import { Select } from '#/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import {
  buildFatWashSteps,
  FAT_TYPES,
  getDefaultFatWashPercentage,
  getFatTypeOptions,
  parseFatWashSearchParams,
} from '#/modules/fatWash';
import { formatAmount } from '#/modules/formatAmount';
import { roundToFriendlyFraction, roundToFriendlyMl } from '#/modules/friendly-rounding';

// A full 750 ml bottle as the starting point.
const DEFAULT_SPIRIT_VOLUME = 750;
const FRIENDLY_VOLUME_STEPS: Record<Unit, number> = { ml: 5, oz: 0.25 };

function isValidSpiritVolume(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function isValidPercentage(percentage: number) {
  return Number.isFinite(percentage) && percentage > 0 && percentage < 100;
}

function roundToFriendlyVolume(amount: number, unit: Unit) {
  const step = FRIENDLY_VOLUME_STEPS[unit];
  const rounded = Math.round(amount / step) * step;
  return rounded > 0 ? rounded : amount;
}

function roundDisplayVolume(amount: number, unit: Unit) {
  const rounded =
    unit === 'ml' ? roundToFriendlyMl(amount) : roundToFriendlyFraction(amount, unit);
  return rounded > 0 ? rounded : amount;
}

function getMilliliters(amount: number, unit: Unit) {
  return tryConvertVolume({ amount, unit }, 'ml')?.amount ?? amount;
}

type CalculatorState = {
  spiritVolumeValue: string | number;
  spiritVolumeMilliliters: number;
  unit: Unit;
  fatPercentageValue: string | number;
  /** Whether the percentage was fixed by the URL or edited by hand — once
   * true, switching fats no longer resets the percentage to the fat's default. */
  percentageLocked: boolean;
  fatType: string;
  /** Prose name for the selected fat (e.g. "butter", "coffee oil", "Baileys"). */
  fatDisplayName: string;
  /** Preserves a custom URL fat's prose name if the user switches away and back. */
  customFat: { label: string; displayName: string } | undefined;
  method: FatWashMethod;
  temperatureC: number | undefined;
  durationMinutes: number | undefined;
};

function getInitialState(searchParams: { toString(): string }): CalculatorState {
  const { fatType, displayName, method, percentage, durationMinutes, temperatureC } =
    parseFatWashSearchParams(searchParams);
  const isCanonicalFat = FAT_TYPES.includes(fatType);

  return {
    spiritVolumeValue: DEFAULT_SPIRIT_VOLUME,
    spiritVolumeMilliliters: DEFAULT_SPIRIT_VOLUME,
    unit: 'ml',
    fatPercentageValue: percentage ?? getDefaultFatWashPercentage(fatType),
    percentageLocked: percentage != null,
    fatType,
    fatDisplayName: displayName,
    customFat: isCanonicalFat ? undefined : { label: fatType, displayName },
    method,
    temperatureC,
    durationMinutes,
  };
}

type CalculatorAction =
  | { type: 'change-spirit-volume'; value: string }
  | { type: 'change-unit'; value: Unit }
  | { type: 'change-percentage'; value: string }
  | { type: 'change-fat-type'; value: string }
  | { type: 'change-method'; value: FatWashMethod };

function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  return match(action)
    .with({ type: 'change-spirit-volume' }, ({ value }) => ({
      ...state,
      ...(isValidSpiritVolume(value)
        ? { spiritVolumeMilliliters: getMilliliters(Number(value), state.unit) }
        : {}),
      spiritVolumeValue: value,
    }))
    .with({ type: 'change-unit' }, ({ value: unit }) => {
      if (unit === state.unit) {
        return state;
      }
      if (!isValidSpiritVolume(state.spiritVolumeValue)) {
        return { ...state, unit };
      }

      const converted = tryConvertVolume(
        { amount: state.spiritVolumeMilliliters, unit: 'ml' },
        unit,
      );

      return {
        ...state,
        spiritVolumeValue:
          converted == null
            ? state.spiritVolumeValue
            : roundToFriendlyVolume(converted.amount, unit),
        unit,
      };
    })
    .with({ type: 'change-percentage' }, ({ value }) => ({
      ...state,
      fatPercentageValue: value,
      percentageLocked: true,
    }))
    .with({ type: 'change-fat-type' }, ({ value }) => ({
      ...state,
      fatType: value,
      fatDisplayName:
        state.customFat?.label === value
          ? state.customFat.displayName
          : value.toLowerCase(),
      // The default percentage follows the fat until locked by a recipe
      // percentage or edited by hand.
      ...(state.percentageLocked
        ? {}
        : {
            fatPercentageValue: getDefaultFatWashPercentage(value),
          }),
    }))
    .with({ type: 'change-method' }, ({ value }) => {
      if (value === state.method) {
        return state;
      }
      return {
        ...state,
        method: value,
        // Recipe-specific duration and temperature belong to the recipe's own
        // method; switching methods resets to the new method's default guidance.
        durationMinutes: undefined,
        temperatureC: undefined,
      };
    })
    .exhaustive();
}

const EMPTY_FAT_URLS: Record<string, Route<`/ingredient/${string}/${string}`>> = {};

function WashIngredients({
  isValid,
  fatVolume,
  spiritVolume,
  unit,
  onUnitChange,
  fatDisplayName,
  fatSlug,
  fatUrl,
}: {
  isValid: boolean;
  fatVolume: number;
  spiritVolume: number;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  fatDisplayName: string;
  fatSlug: string;
  fatUrl: Route<`/ingredient/${string}/${string}`> | undefined;
}) {
  const ingredients: RecipeIngredient[] = isValid
    ? [
        {
          name: fatDisplayName,
          slug: fatSlug,
          type: 'other',
          quantity: { amount: fatVolume, unit },
          categories: [],
          refs: [],
          ingredients: [],
        },
        {
          name: 'spirit',
          slug: 'spirit',
          type: 'spirit',
          quantity: { amount: spiritVolume, unit },
          categories: [],
          refs: [],
          ingredients: [],
        },
      ]
    : [];

  return (
    <section aria-label="Ingredients">
      <div role="status" aria-live="polite">
        {isValid ? (
          <IngredientList
            ingredients={ingredients}
            preferredUnit={unit}
            onUnitChange={onUnitChange}
            controls="unit"
            getIngredientHref={(ingredient) =>
              ingredient.slug === fatSlug ? fatUrl : undefined
            }
          />
        ) : (
          <div className="py-2">
            <ListSubheader>Ingredients</ListSubheader>
            <p className="surface px-4 py-3 text-base">
              Enter a valid spirit volume and percentage to calculate the fat to add.
            </p>
            <div className="flex min-h-14 items-center justify-between px-2 min-[600px]:min-h-16 min-[600px]:px-6">
              <UnitSelector value={unit} onChange={onUnitChange} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function FatWashCalculator({
  fatUrls = EMPTY_FAT_URLS,
}: {
  /** Known fat ingredient pages keyed by slug, resolved on the server so
   * every fat links to its actual type folder (e.g. Baileys under liqueur/)
   * and unknown fats stay plain text instead of 404ing. */
  fatUrls?: Record<string, Route<`/ingredient/${string}/${string}`>>;
}) {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(calculatorReducer, searchParams, getInitialState);
  const {
    spiritVolumeValue,
    unit,
    fatPercentageValue,
    fatType,
    fatDisplayName,
    customFat,
    method,
    temperatureC,
    durationMinutes,
  } = state;

  const isSpiritVolumeValid = isValidSpiritVolume(spiritVolumeValue);
  const fatPercentage = Number(fatPercentageValue);
  const isPercentageValid = isValidPercentage(fatPercentage);
  const isWashValid = isSpiritVolumeValid && isPercentageValid;

  const spiritVolume = Number(spiritVolumeValue);
  const fatVolume = isWashValid
    ? roundDisplayVolume((spiritVolume * fatPercentage) / 100, unit)
    : Number.NaN;
  const fatAmount = isWashValid
    ? `${formatAmount(fatVolume)} ${unit} of ${fatDisplayName}`
    : 'the fat';
  const fatSlug = slugify(fatType);
  const fatUrl = fatType === 'Other fat' ? undefined : fatUrls[fatSlug];

  const instructions = buildFatWashSteps({
    fatType,
    fatAmount,
    method,
    durationMinutes,
    temperatureC: method === 'sous-vide' ? temperatureC : undefined,
  });

  const instructionControls = (
    <ToggleGroup
      value={method}
      onChange={(nextMethod) => {
        dispatch({ type: 'change-method', value: nextMethod });
      }}
      aria-label="Wash method"
      fullWidth
    >
      <ToggleGroupItem value="room-temp">Room temp</ToggleGroupItem>
      <ToggleGroupItem value="sous-vide">Sous-vide</ToggleGroupItem>
    </ToggleGroup>
  );

  return (
    <>
      <Card m={1}>
        <CardHeader>
          <CardTitle>Fat Wash</CardTitle>
        </CardHeader>
        <CardContent>
          <section aria-label="Fat quantity" className="flex flex-col gap-4">
            <LabeledField
              label="Spirit volume"
              unit={unit}
              value={spiritVolumeValue}
              type="number"
              onChange={(event) => {
                dispatch({ type: 'change-spirit-volume', value: event.target.value });
              }}
              error={!isSpiritVolumeValid}
              helperText={isSpiritVolumeValid ? undefined : 'Must be greater than 0'}
              min={0}
              step="any"
            />
            <div className="flex flex-col gap-4 min-[600px]:flex-row">
              <Select
                label="Fat"
                value={fatType}
                options={getFatTypeOptions(customFat?.label)}
                onChange={(value) => {
                  dispatch({ type: 'change-fat-type', value });
                }}
                className="min-w-0 flex-1"
              />
              <LabeledField
                label="Fat percentage"
                unit="%"
                value={fatPercentageValue}
                type="number"
                onChange={(event) => {
                  dispatch({ type: 'change-percentage', value: event.target.value });
                }}
                error={!isPercentageValid}
                helperText={isPercentageValid ? undefined : 'Must be between 0 and 100'}
                min={0}
                max={100}
                step="any"
                className="min-w-0 flex-1"
              />
            </div>
          </section>
        </CardContent>
      </Card>
      <WashIngredients
        isValid={isWashValid}
        fatVolume={fatVolume}
        spiritVolume={spiritVolume}
        unit={unit}
        onUnitChange={(nextUnit) => {
          dispatch({ type: 'change-unit', value: nextUnit });
        }}
        fatDisplayName={fatDisplayName}
        fatSlug={fatSlug}
        fatUrl={fatUrl}
      />
      <CalculatorInstructions steps={instructions} controls={instructionControls} />
    </>
  );
}
