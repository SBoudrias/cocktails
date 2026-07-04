import { match } from 'ts-pattern';

type Unit =
  | 'oz'
  | 'ml'
  | 'dash'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'drop'
  | 'pinch'
  | 'spray'
  | 'unit'
  | 'gram'
  | 'bottle'
  | 'part';

export type Quantity = {
  amount: number;
  maximum?: number;
  modifier?: 'scant';
  unit: Unit;
};

function getVolumeFactor(unit: Unit) {
  return match(unit)
    .returnType<number | undefined>()
    .with('ml', () => 1)
    .with('tsp', () => 5)
    .with('tbsp', () => 15)
    .with('oz', () => 30)
    .with('cup', () => 240)
    .with('dash', () => 30 / 32)
    .with('drop', () => 30 / 576)
    .with('spray', () => 30 / 160)
    .otherwise(() => undefined);
}

export function tryConvertVolume<TargetUnit extends 'ml' | 'oz'>(
  quantity: Quantity,
  targetUnit: TargetUnit,
): (Omit<Quantity, 'unit'> & { unit: TargetUnit }) | undefined {
  const targetFactor = getVolumeFactor(targetUnit);
  const sourceFactor = getVolumeFactor(quantity.unit);
  if (targetFactor === undefined || sourceFactor === undefined) {
    return undefined;
  }

  const factor = sourceFactor / targetFactor;
  const maximum = quantity.maximum == null ? {} : { maximum: quantity.maximum * factor };

  return {
    ...quantity,
    amount: quantity.amount * factor,
    ...maximum,
    unit: targetUnit,
  };
}
