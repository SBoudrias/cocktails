const FRACTION_TARGETS = [0, 0.25, 0.33, 0.5, 0.67, 0.75, 1];

export function roundToFriendlyFraction(amount: number): number {
  const base = Math.floor(amount);
  const fraction = amount - base;

  let closest = FRACTION_TARGETS[0]!;
  let minDiff = Math.abs(fraction - closest);

  for (const target of FRACTION_TARGETS) {
    const diff = Math.abs(fraction - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = target;
    }
  }

  return base + closest;
}

export function roundToFriendlyMl(amount: number): number {
  if (amount < 15) {
    return Math.round(amount / 2.5) * 2.5;
  }

  return Math.round(amount / 5) * 5;
}
