'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { tryConvertVolume } from '@cocktails/conversion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useReducer } from 'react';
import { match } from 'ts-pattern';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { Card, CardContent } from '#/components/ui/card';
import { LabeledField } from '#/components/ui/labeled-field';
import { ListSubheader } from '#/components/ui/list';
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

// MUI's Alert severity=warning, standard variant (probed on the baseline):
// body2 metrics on a 4px-radius block of darken(warning.light, 0.9) with
// 6px/16px padding, its text lighten(warning.light, 0.6); the icon is
// MUI's ReportProblemOutlined — warning.main, 22px, 90% opacity, a 12px
// right margin and 7px vertical padding, the message 8px vertical padding.
function WarningAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex rounded-sm px-4 py-1.5 text-sm leading-[1.43] text-[#F7DDC3] bg-[#17110A]"
    >
      <div
        aria-hidden="true"
        className="mr-3 flex py-[7px] text-[22px] leading-none text-[#D4883D] opacity-90"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] fill-current">
          <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
        </svg>
      </div>
      <div className="min-w-0 overflow-auto py-2">{children}</div>
    </div>
  );
}

// MUI's TextField select: the same outlined shell as LabeledField (the
// fieldset with its notched legend sizer and the floating label span), the
// trigger styled like the input row, and the arrow MUI drew (its
// ArrowDropDown triangle, 24px, white) at the row's end.
function MilkSelect({
  milkType,
  customMilkType,
  onChange,
}: {
  milkType: string;
  customMilkType: string | undefined;
  onChange: (milkType: string) => void;
}) {
  const labelId = useId();
  const options = customMilkType ? [...MILK_TYPES, customMilkType] : MILK_TYPES;

  return (
    <div className="group relative h-14">
      <fieldset
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -top-[5px] m-0 overflow-hidden rounded-sm border border-input px-2 group-focus-within:border-2 group-focus-within:border-primary"
      >
        <legend className="block h-[11px] max-w-full p-0">
          <span
            aria-hidden="true"
            className="block px-[5px] text-xs leading-[23px] whitespace-nowrap opacity-0"
          >
            Milk
          </span>
        </legend>
      </fieldset>
      <span
        id={labelId}
        className="absolute top-[-9px] left-[14px] max-w-full truncate text-xs leading-[17.25px] text-muted-foreground group-focus-within:text-primary"
      >
        Milk
      </span>
      <SelectPrimitive.Root
        value={milkType}
        onValueChange={(value) => {
          onChange(String(value));
        }}
      >
        <SelectPrimitive.Trigger
          aria-labelledby={labelId}
          className="relative h-14 w-full rounded-sm bg-transparent pr-11 pl-[14px] text-base text-left outline-none"
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon className="absolute top-1/2 right-[7px] -translate-y-1/2 text-white">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-current">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            align="start"
            sideOffset={0}
            // MUI's menu surface: the Paper glass without radius, the
            // trigger's width, 8px vertical padding (probed on the baseline).
            className="surface z-50 overflow-y-auto py-2 rounded-none min-w-[var(--anchor-width)]"
          >
            <SelectPrimitive.Popup>
              {options.map((type) => (
                <SelectPrimitive.Item
                  key={type}
                  value={type}
                  // MUI's MenuItem: auto rows 36px tall, 16px left padding,
                  // the selected item on primary/16 (probed on the baseline).
                  className="flex h-9 items-center px-4 text-base text-foreground outline-none data-selected:bg-primary/16 data-highlighted:bg-white/8"
                >
                  <SelectPrimitive.ItemText>{type}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

// MUI's ListItem: 8px vertical padding, 16px left, the bottom divider and
// ListItemText's 4px inner margins — the row the recipe pages' lists share.
function InstructionRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex w-full items-center border-x-0 border-t-0 border-b border-border py-2 pr-4 pl-4 text-base">
      <span className="my-1 flex-1 text-left">{children}</span>
    </li>
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
              <p className="text-sm leading-[1.43]">
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
            <WarningAlert>
              Clarified dairy milk punch still contains dairy allergens. Check alternative
              milks for nut or soy allergens.
            </WarningAlert>
          </section>
        </CardContent>
      </Card>
      <section aria-label="Instructions">
        {/* MUI's List + ListSubheader + Paper(square): the subheader is
            itself a list item above the surface block of divider rows (the
            recipe pages' list pattern, probed: py-8 outer, 16px subheader
            padding). */}
        <ul className="py-2">
          <li>
            <ListSubheader>Instructions</ListSubheader>
            <div className="surface">
              {instructions.map((instruction, index) => (
                <InstructionRow key={instruction}>
                  {index + 1}. {instruction}
                </InstructionRow>
              ))}
            </div>
          </li>
        </ul>
      </section>
      <ul className="py-2">
        <li>
          <div className="surface">
            <Link
              href={getMilkClarifiedRecipeListUrl()}
              className="relative flex w-full items-center border-x-0 border-t-0 border-b border-border py-2 pr-12 pl-4 text-base transition-colors duration-100 hover:bg-muted"
            >
              <span className="my-1 flex-1 text-left">Browse milk-clarified recipes</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="absolute top-1/2 right-4 size-6 -translate-y-1/2 fill-current text-foreground"
              >
                <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </Link>
          </div>
        </li>
      </ul>
    </>
  );
}
