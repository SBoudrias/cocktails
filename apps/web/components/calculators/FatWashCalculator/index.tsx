'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { tryConvertVolume } from '@cocktails/conversion';
import type { FatWashMethod } from '@cocktails/data';
import slugify from '@sindresorhus/slugify';
import { ChevronDown } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { match } from 'ts-pattern';
import { CalculatorInstructions } from '#/components/calculators/CalculatorInstructions';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { LabeledField, OutlinedField } from '#/components/ui/labeled-field';
import { List, ListRow, ListSubheader } from '#/components/ui/list';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import {
  buildFatWashSteps,
  DEFAULT_SOUS_VIDE_TEMP_C,
  FAT_TYPES,
  getDefaultFatWashPercentage,
  getFatTypeOptions,
  normalizeFatType,
  parseFatWashMethod,
  parseFatWashPercentage,
} from '#/modules/fatWash';
import { formatAmount } from '#/modules/formatAmount';

// A full 750 ml bottle as the starting point.
const DEFAULT_SPIRIT_VOLUME = 750;
const FRIENDLY_VOLUME_STEPS: Record<Unit, number> = { ml: 5, oz: 0.25 };
const MIN_SOUS_VIDE_TEMP_C = 30;
const MAX_SOUS_VIDE_TEMP_C = 100;

function isValidSpiritVolume(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function isValidPercentage(percentage: number) {
  return Number.isFinite(percentage) && percentage > 0 && percentage < 100;
}

function isValidTemperatureC(value: string | number) {
  const temp = Number(value);
  return (
    value !== '' &&
    Number.isFinite(temp) &&
    temp >= MIN_SOUS_VIDE_TEMP_C &&
    temp <= MAX_SOUS_VIDE_TEMP_C
  );
}

function parsePositiveMinutes(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function roundToFriendlyVolume(amount: number, unit: Unit) {
  const step = FRIENDLY_VOLUME_STEPS[unit];
  const rounded = Math.round(amount / step) * step;
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
  temperatureCValue: string | number;
  durationMinutes: number | undefined;
};

function getInitialState(searchParams: Pick<URLSearchParams, 'get'>): CalculatorState {
  const { fatType, displayName } = normalizeFatType(searchParams.get('fat'));
  const urlPercentage = parseFatWashPercentage(searchParams.get('percentage'));
  const method = parseFatWashMethod(searchParams.get('method')) ?? 'room-temp';
  const rawTemp = searchParams.get('temp');
  const temperatureCValue =
    rawTemp != null && isValidTemperatureC(rawTemp)
      ? Number(rawTemp)
      : DEFAULT_SOUS_VIDE_TEMP_C;
  const isCanonicalFat = FAT_TYPES.some((type) => type === fatType);

  return {
    spiritVolumeValue: DEFAULT_SPIRIT_VOLUME,
    spiritVolumeMilliliters: DEFAULT_SPIRIT_VOLUME,
    unit: 'ml',
    fatPercentageValue: urlPercentage ?? getDefaultFatWashPercentage(fatType),
    percentageLocked: urlPercentage != null,
    fatType,
    fatDisplayName: displayName,
    customFat: isCanonicalFat ? undefined : { label: fatType, displayName },
    method,
    temperatureCValue,
    durationMinutes: parsePositiveMinutes(searchParams.get('duration')),
  };
}

type CalculatorAction =
  | { type: 'change-spirit-volume'; value: string }
  | { type: 'change-unit'; value: Unit }
  | { type: 'change-percentage'; value: string }
  | { type: 'change-fat-type'; value: string }
  | { type: 'change-method'; value: FatWashMethod }
  | { type: 'change-temperature'; value: string };

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
        // Recipe-specific duration belongs to the recipe's own method;
        // switching methods resets to the new method's default guidance.
        durationMinutes: undefined,
      };
    })
    .with({ type: 'change-temperature' }, ({ value }) => ({
      ...state,
      temperatureCValue: value,
    }))
    .exhaustive();
}

// A select on the shared OutlinedField shell, the trigger styled like the
// input row, lucide's ChevronDown at its end — the milk select's shape.
function FatSelect({
  fatType,
  customFatLabel,
  onChange,
  className,
}: {
  fatType: string;
  customFatLabel: string | undefined;
  onChange: (fatType: string) => void;
  className?: string;
}) {
  const options = getFatTypeOptions(customFatLabel);

  return (
    <OutlinedField label="Fat" className={className}>
      {(labelId) => (
        <SelectPrimitive.Root<string>
          value={fatType}
          onValueChange={(value) => {
            if (value != null) onChange(value);
          }}
        >
          <SelectPrimitive.Trigger
            aria-labelledby={labelId}
            className="relative h-14 w-full rounded-sm bg-transparent pr-11 pl-3.5 text-left text-base outline-none"
          >
            <SelectPrimitive.Value />
            <SelectPrimitive.Icon className="absolute top-1/2 right-1.75 -translate-y-1/2 text-foreground">
              <ChevronDown className="size-6" aria-hidden="true" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              align="start"
              sideOffset={0}
              // The menu surface: the opaque paper (the same solid the app
              // bar and toasts use) — the translucent glass recipe lets the
              // page bleed through a floating menu that nothing anchors.
              className="z-50 min-w-(--anchor-width) overflow-y-auto rounded-none bg-(--paper) py-2 shadow-(--surface-shadow)"
            >
              <SelectPrimitive.Popup>
                {options.map((type) => (
                  <SelectPrimitive.Item
                    key={type}
                    value={type}
                    className="flex h-9 items-center px-4 text-base text-foreground outline-none data-highlighted:bg-muted data-selected:bg-primary/16"
                  >
                    <SelectPrimitive.ItemText>{type}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      )}
    </OutlinedField>
  );
}

const EMPTY_FAT_URLS: Record<string, Route<`/ingredient/${string}/${string}`>> = {};

function WashIngredients({
  isValid,
  fatVolume,
  spiritVolume,
  unit,
  fatDisplayName,
  fatUrl,
}: {
  isValid: boolean;
  fatVolume: number;
  spiritVolume: number;
  unit: Unit;
  fatDisplayName: string;
  fatUrl: Route<`/ingredient/${string}/${string}`> | undefined;
}) {
  return (
    <section aria-label="Ingredients" className="py-2">
      <ListSubheader>Ingredients</ListSubheader>
      <div role="status" aria-live="polite">
        {isValid ? (
          <List aria-label="Wash ingredients" className="surface py-0">
            <ListRow>
              <span className="my-1 flex-1 text-left">
                {formatAmount(fatVolume)} {unit}{' '}
                {fatUrl ? (
                  <Link href={fatUrl} className="text-primary underline">
                    {fatDisplayName}
                  </Link>
                ) : (
                  fatDisplayName
                )}
              </span>
            </ListRow>
            <ListRow>
              <span className="my-1 flex-1 text-left">
                {formatAmount(spiritVolume)} {unit} spirit
              </span>
            </ListRow>
          </List>
        ) : (
          <p className="surface px-4 py-3 text-base">
            Enter a valid spirit volume and percentage to calculate the fat to add.
          </p>
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
    temperatureCValue,
    durationMinutes,
  } = state;

  const isSpiritVolumeValid = isValidSpiritVolume(spiritVolumeValue);
  const fatPercentage = Number(fatPercentageValue);
  const isPercentageValid = isValidPercentage(fatPercentage);
  const isWashValid = isSpiritVolumeValid && isPercentageValid;
  const isTemperatureValid = isValidTemperatureC(temperatureCValue);

  const spiritVolume = Number(spiritVolumeValue);
  const fatVolume = isWashValid
    ? roundToFriendlyVolume((spiritVolume * fatPercentage) / 100, unit)
    : Number.NaN;
  const fatAmount = isWashValid
    ? `${formatAmount(fatVolume)} ${unit} of ${fatDisplayName}`
    : 'the fat';
  const fatUrl = fatType === 'Other fat' ? undefined : fatUrls[slugify(fatType)];

  const instructions = buildFatWashSteps({
    fatType,
    fatAmount,
    method,
    durationMinutes,
    temperatureC:
      method === 'sous-vide' && isTemperatureValid
        ? Number(temperatureCValue)
        : undefined,
  });

  const instructionControls = (
    <>
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
      {method === 'sous-vide' && (
        <LabeledField
          label="Sous-vide temperature"
          unit="°C"
          value={temperatureCValue}
          type="number"
          onChange={(event) => {
            dispatch({ type: 'change-temperature', value: event.target.value });
          }}
          error={!isTemperatureValid}
          helperText={
            isTemperatureValid
              ? undefined
              : `Must be between ${MIN_SOUS_VIDE_TEMP_C} and ${MAX_SOUS_VIDE_TEMP_C}°C`
          }
          min={MIN_SOUS_VIDE_TEMP_C}
          max={MAX_SOUS_VIDE_TEMP_C}
          step="any"
        />
      )}
    </>
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
              <FatSelect
                fatType={fatType}
                customFatLabel={customFat?.label}
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
            <UnitSelector
              value={unit}
              onChange={(nextUnit) => {
                dispatch({ type: 'change-unit', value: nextUnit });
              }}
            />
          </section>
        </CardContent>
      </Card>
      <WashIngredients
        isValid={isWashValid}
        fatVolume={fatVolume}
        spiritVolume={spiritVolume}
        unit={unit}
        fatDisplayName={fatDisplayName}
        fatUrl={fatUrl}
      />
      <CalculatorInstructions steps={instructions} controls={instructionControls} />
    </>
  );
}
