import { tryConvertVolume } from '@cocktails/conversion';
import type { Recipe, RecipeTechnique } from '@cocktails/data';
import { P, match } from 'ts-pattern';
import type { Unit } from '#/components/Quantity/Selector';

function isAppliedToTheServing(ingredient: Recipe['ingredients'][number]) {
  return match(ingredient.technique)
    .with(undefined, () => false)
    .with(
      P.array({ technique: 'application' }),
      (applications) => applications.length > 0,
    )
    .with({ technique: 'application' }, () => true)
    .otherwise(() => false);
}

/**
 * Sums every ingredient quantity that converts to a volume, skipping
 * unit-counted items like whole fruit and finishes applied to the serving
 * (floats, tops, rinses) rather than mixed into the batch.
 */
export function getBatchVolumeMilliliters(ingredients: Recipe['ingredients']) {
  let batchMilliliters = 0;

  for (const ingredient of ingredients) {
    if (isAppliedToTheServing(ingredient)) {
      continue;
    }

    const milliliters = tryConvertVolume(ingredient.quantity, 'ml')?.amount;
    if (milliliters != null) {
      batchMilliliters += milliliters;
    }
  }

  return batchMilliliters > 0 ? batchMilliliters : undefined;
}

/**
 * Derives the recipe's own milk-to-batch ratio from its milk clarification
 * technique, when the batch volume is computable and the milk fits inside it.
 */
export function getMilkRatio(
  milkClarification: Extract<RecipeTechnique, { method: 'milk' }>,
  ingredients: Recipe['ingredients'],
) {
  const milkMilliliters = tryConvertVolume(milkClarification.quantity, 'ml')?.amount;
  const batchMilliliters = getBatchVolumeMilliliters(ingredients);

  if (
    milkMilliliters == null ||
    batchMilliliters == null ||
    milkMilliliters >= batchMilliliters
  ) {
    return undefined;
  }

  return milkMilliliters / batchMilliliters;
}

/**
 * Builds the calculator context for a recipe: its batch volume in the
 * preferred display unit, plus the recipe's own ratio when it defines one.
 */
export function getMilkClarificationContext({
  milkClarification,
  ingredients,
  preferredUnit,
}: {
  milkClarification: Extract<RecipeTechnique, { method: 'milk' }>;
  ingredients: Recipe['ingredients'];
  preferredUnit: Unit;
}) {
  const batchMilliliters = getBatchVolumeMilliliters(ingredients);
  if (batchMilliliters == null) {
    return undefined;
  }

  const converted = tryConvertVolume(
    { amount: batchMilliliters, unit: 'ml' },
    preferredUnit,
  );
  const batchQuantity: { amount: number; unit: Unit } =
    converted == null
      ? { amount: batchMilliliters, unit: 'ml' }
      : { amount: converted.amount, unit: preferredUnit };

  return {
    batchQuantity,
    ratio: getMilkRatio(milkClarification, ingredients),
  };
}
