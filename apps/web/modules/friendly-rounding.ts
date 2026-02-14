// Jiggers have ⅓ and ⅔ marks; measuring spoons/cups only have quarter and eighth increments
const OZ_TARGETS = [0, 0.125, 0.25, 0.33, 0.5, 0.67, 0.75, 0.875, 1];
const QUARTER_TARGETS = [0, 0.25, 0.5, 0.75, 1];

function snapFraction(fraction: number, targets: number[]): number {
  let closest = targets[0]!;
  let minDiff = Math.abs(fraction - closest);

  for (const target of targets) {
    const diff = Math.abs(fraction - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = target;
    }
  }

  return closest;
}

export function roundToFriendlyFraction(amount: number, unit: string = 'oz'): number {
  const base = Math.floor(amount);
  const fraction = amount - base;
  const targets = unit === 'oz' ? OZ_TARGETS : QUARTER_TARGETS;

  return base + snapFraction(fraction, targets);
}

export function roundToFriendlyMl(amount: number): number {
  if (amount < 15) {
    return Math.round(amount / 2.5) * 2.5;
  }

  return Math.round(amount / 5) * 5;
}
