import type { RecipeIngredient } from '@cocktails/data';

type Quantity = RecipeIngredient['quantity'];

const VOLUME_TO_ML = {
  ml: 1,
  tsp: 5,
  tbsp: 15,
  oz: 30,
  cup: 240,
};

function isVolumeUnit(unit: string): unit is keyof typeof VOLUME_TO_ML {
  return unit in VOLUME_TO_ML;
}

export function tryConvertVolume<TargetUnit extends 'ml' | 'oz'>(
  quantity: Quantity,
  targetUnit: TargetUnit,
): (Omit<Quantity, 'unit'> & { unit: TargetUnit }) | undefined {
  const unit: string = quantity.unit;
  if (!isVolumeUnit(unit)) {
    return undefined;
  }

  const targetFactor = VOLUME_TO_ML[targetUnit];
  const factor = VOLUME_TO_ML[unit] / targetFactor;
  return {
    ...quantity,
    amount: quantity.amount * factor,
    maximum: quantity.maximum == null ? undefined : quantity.maximum * factor,
    unit: targetUnit,
  };
}
