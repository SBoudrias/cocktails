'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { tryConvertVolume } from '@cocktails/conversion';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useReducer } from 'react';
import { match } from 'ts-pattern';
import { LinkListItem } from '#/components/LinkList';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { Alert } from '#/components/ui/alert';
import { Card, CardContent } from '#/components/ui/card';
import { LabeledField, OutlinedField } from '#/components/ui/labeled-field';
import { ListSubheader, ListRow } from '#/components/ui/list';
import { formatAmount } from '#/modules/formatAmount';
import { getMilkClarifiedRecipeListUrl } from '#/modules/url';

const DEFAULT_BATCH_VOLUME = 1000;
const DEFAULT_MILK_RATIO = 0.25;
const MILK_TYPES = ['Whole milk', 'Coconut milk', 'Other milk'];
const FRIENDLY_VOLUME_STEPS: Record<Unit, number> = { ml: 5, oz: 0.25 };

function isValidBatchVolume(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function roundToFriendlyVolume(amount: number, unit: Unit) {
  const step = FRIENDLY_VOLUME_STEPS[unit];
  const rounded = Math.round(amount / step) * step;
  return rounded > 0 ? rounded : amount;
}

function getMilliliters(amount: number, unit: Unit) {
  return tryConvertVolume({ amount, unit }, 'ml')?.amount ?? amount;
}

function normalizeMilkType(milkType: string | null) {
  const normalizedMilkType = milkType?.trim().replace(/\s+/g, ' ');

  if (!normalizedMilkType) {
    return 'Whole milk';
  }

  return (
    MILK_TYPES.find(
      (canonicalMilkType) =>
        canonicalMilkType.toLowerCase() === normalizedMilkType.toLowerCase(),
    ) ?? normalizedMilkType
  );
}

function getInitialBatchVolume(searchParams: Pick<URLSearchParams, 'get'>) {
  const unit: Unit = match(searchParams.get('unit'))
    .with('oz', () => 'oz' as const)
    .otherwise(() => 'ml' as const);
  const amount = Number(searchParams.get('amount'));

  if (!isValidBatchVolume(amount)) {
    return {
      batchVolumeValue: DEFAULT_BATCH_VOLUME as string | number,
      batchVolumeMilliliters: DEFAULT_BATCH_VOLUME,
      unit: 'ml' as Unit,
    };
  }

  const batchVolume = roundToFriendlyVolume(amount, unit);

  return {
    batchVolumeValue: batchVolume,
    batchVolumeMilliliters: getMilliliters(batchVolume, unit),
    unit,
  };
}

function getInitialMilkRatio(searchParams: Pick<URLSearchParams, 'get'>) {
  const ratio = Number(searchParams.get('ratio'));
  const isRecipeRatio = Number.isFinite(ratio) && ratio > 0 && ratio < 1;

  return {
    milkRatio: isRecipeRatio ? ratio : DEFAULT_MILK_RATIO,
    hasRecipeMilkRatio: isRecipeRatio,
  };
}

function formatMilkRatioPercent(ratio: number) {
  const percent = ratio * 100;
  return Number.isInteger(percent) ? percent : Math.round(percent * 10) / 10;
}

type CalculatorState = {
  batchVolumeMilliliters: number;
  batchVolumeValue: string | number;
  milkRatio: number;
  hasRecipeMilkRatio: boolean;
  milkType: string;
  customMilkType: string | undefined;
  unit: Unit;
};

function getInitialState(searchParams: Pick<URLSearchParams, 'get'>): CalculatorState {
  const milkType = normalizeMilkType(searchParams.get('milkType'));

  return {
    ...getInitialBatchVolume(searchParams),
    ...getInitialMilkRatio(searchParams),
    milkType,
    customMilkType: MILK_TYPES.includes(milkType) ? undefined : milkType,
  };
}

type CalculatorAction =
  | { type: 'change-batch-volume'; value: string }
  | { type: 'change-milk-type'; value: string }
  | { type: 'change-unit'; value: Unit };

function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  return match(action)
    .with({ type: 'change-batch-volume' }, ({ value }) => ({
      ...state,
      ...(isValidBatchVolume(value)
        ? { batchVolumeMilliliters: getMilliliters(Number(value), state.unit) }
        : {}),
      batchVolumeValue: value,
    }))
    .with({ type: 'change-milk-type' }, ({ value }) => ({
      ...state,
      milkType: value,
    }))
    .with({ type: 'change-unit' }, ({ value: unit }) => {
      if (unit === state.unit) {
        return state;
      }
      if (!isValidBatchVolume(state.batchVolumeValue)) {
        return { ...state, unit };
      }

      const converted = tryConvertVolume(
        { amount: state.batchVolumeMilliliters, unit: 'ml' },
        unit,
      );

      return {
        ...state,
        batchVolumeValue:
          converted == null
            ? state.batchVolumeValue
            : roundToFriendlyVolume(converted.amount, unit),
        unit,
      };
    })
    .exhaustive();
}

// A select on the shared OutlinedField shell: the trigger styled like the
// input row, the arrow lucide's ChevronDown (icon rule) at the row's end.
function MilkSelect({
  milkType,
  customMilkType,
  onChange,
}: {
  milkType: string;
  customMilkType: string | undefined;
  onChange: (milkType: string) => void;
}) {
  const options = customMilkType ? [...MILK_TYPES, customMilkType] : MILK_TYPES;

  return (
    <OutlinedField label="Milk">
      {(labelId) => (
        <SelectPrimitive.Root<string>
          value={milkType}
          onValueChange={(value) => {
            if (value != null) onChange(value);
          }}
        >
          <SelectPrimitive.Trigger
            aria-labelledby={labelId}
            className="relative h-14 w-full rounded-sm bg-transparent pr-11 pl-3.5 text-base text-left outline-none"
          >
            <SelectPrimitive.Value />
            <SelectPrimitive.Icon className="absolute top-1/2 right-1.75 -translate-y-1/2 text-white">
              <ChevronDown className="size-6" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              align="start"
              sideOffset={0}
              // The menu surface: the paper glass without radius, the
              // trigger's width, 8px vertical padding.
              className="surface z-50 overflow-y-auto py-2 rounded-none min-w-[var(--anchor-width)]"
            >
              <SelectPrimitive.Popup>
                {options.map((type) => (
                  <SelectPrimitive.Item
                    key={type}
                    value={type}
                    // A menu row: auto rows 36px tall, 16px left padding,
                    // the selected item on primary/16.
                    className="flex h-9 items-center px-4 text-base text-foreground outline-none data-selected:bg-primary/16 data-highlighted:bg-white/8"
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

export default function MilkClarificationCalculator() {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(calculatorReducer, searchParams, getInitialState);
  const {
    batchVolumeValue,
    milkRatio,
    hasRecipeMilkRatio,
    milkType,
    customMilkType,
    unit,
  } = state;
  const isBatchVolumeValid = isValidBatchVolume(batchVolumeValue);
  const milkVolume = isBatchVolumeValid
    ? roundToFriendlyVolume(Number(batchVolumeValue) * milkRatio, unit)
    : NaN;
  const milkQuantityText = isBatchVolumeValid
    ? `${formatAmount(milkVolume)} ${unit} of ${milkType.toLowerCase()}`
    : 'the milk';

  const milkGuidance = match(milkType)
    .with('Whole milk', () => undefined)
    .otherwise(() => 'Results vary by product, so test a small batch before scaling up.');

  const instructions = [
    ...match(milkType)
      .with('Coconut milk', () => ['Warm it first if needed to emulsify.'])
      .otherwise(() => []),
    'Make sure the cocktail batch has enough acidity or astringency to curdle the milk.',
    `Put the ${milkQuantityText} in a large container. Slowly stir in one third of the cocktail. Stop stirring when curds form, then gently add the rest without stirring.`,
    'Rest for at least 15 minutes, then filter gently through a coffee filter or fine strainer without disturbing the curds. Pour the first cloudy filtrate back through the same curd bed.',
  ];

  return (
    <>
      <Card m={1}>
        <CardContent>
          <section aria-label="Milk quantity" className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 min-[600px]:flex-row">
              <LabeledField
                label="Cocktail batch volume"
                unit={unit}
                value={batchVolumeValue}
                type="number"
                onChange={(event) => {
                  dispatch({ type: 'change-batch-volume', value: event.target.value });
                }}
                error={!isBatchVolumeValid}
                helperText={
                  isBatchVolumeValid
                    ? 'Cocktail mixture before adding milk.'
                    : 'Must be greater than 0'
                }
                min={0}
                step="any"
                className="min-w-0 flex-1"
              />
              <LabeledField
                label={
                  hasRecipeMilkRatio
                    ? 'Recipe milk-to-batch ratio'
                    : 'Milk-to-batch ratio'
                }
                unit="%"
                value={formatMilkRatioPercent(milkRatio)}
                readOnly
                className="min-w-0 flex-1"
              />
            </div>
            <MilkSelect
              milkType={milkType}
              customMilkType={customMilkType}
              onChange={(value) => {
                dispatch({ type: 'change-milk-type', value });
              }}
            />
            <UnitSelector
              value={unit}
              onChange={(nextUnit) => {
                dispatch({ type: 'change-unit', value: nextUnit });
              }}
            />
            <div role="status" aria-live="polite">
              {isBatchVolumeValid ? (
                <p className="text-2xl leading-8 font-normal">
                  Add {formatAmount(milkVolume)} {unit} of {milkType.toLowerCase()}
                </p>
              ) : (
                <p className="text-base">
                  Enter a valid batch volume to calculate the milk to add.
                </p>
              )}
              {milkGuidance && <p className="text-sm">{milkGuidance}</p>}
            </div>
            {!hasRecipeMilkRatio && (
              <p className="text-sm">
                This uses a {formatMilkRatioPercent(milkRatio)}% milk-to-batch starting
                point from the{' '}
                <a
                  href="https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/"
                  target="_blank"
                  rel="noopener nofollow"
                  className="text-primary underline"
                >
                  Campari Academy milk punch guide
                </a>
                . If following a recipe, use its specified milk quantity instead of this
                general starting point.
              </p>
            )}
            <Alert severity="warning">
              Clarified dairy milk punch still contains dairy allergens. Check alternative
              milks for nut or soy allergens.
            </Alert>
          </section>
        </CardContent>
      </Card>
      <section aria-label="Instructions">
        {/* The recipe pages' list pattern — the subheader itself a list
            item above the surface block of divider rows: py-8 outer,
            16px subheader padding. */}
        <ul className="py-2">
          <li>
            <ListSubheader>Instructions</ListSubheader>
            <div className="surface">
              {instructions.map((instruction, index) => (
                <ListRow key={instruction}>
                  <span className="my-1 flex-1 text-left">
                    {index + 1}. {instruction}
                  </span>
                </ListRow>
              ))}
            </div>
          </li>
        </ul>
      </section>
      <ul className="py-2">
        <div className="surface">
          <LinkListItem
            href={getMilkClarifiedRecipeListUrl()}
            primary="Browse milk-clarified recipes"
          />
        </div>
      </ul>
    </>
  );
}
