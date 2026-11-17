import { match } from 'ts-pattern';

export type SuperJuiceCitrus = 'lemon' | 'lime' | 'orange' | 'grapefruit' | 'kumquat';

export const DEFAULT_CITRUS: SuperJuiceCitrus = 'lime';

/** The URL param is a free string; this narrows it to a known citrus. */
export const isSuperJuiceCitrus = (value: string | null): value is SuperJuiceCitrus =>
  value != null &&
  match(value)
    .with('lemon', 'lime', 'orange', 'grapefruit', 'kumquat', () => true)
    .otherwise(() => false);

/**
 * Acid, MSG and water additions per gram of input weight, from the published
 * Super Juice recipes: peeled citrus is measured by peel weight, kumquats by
 * whole-fruit weight (they are too small to peel, so the acid stands in for
 * the missing peels and the water scales with it instead).
 */
const SUPER_JUICE_RATIOS: Record<
  SuperJuiceCitrus,
  { citric: number; malic: number; msg: number; water: number }
> = {
  lemon: { citric: 1, malic: 0, msg: 0, water: 16.66 },
  lime: { citric: 0.66, malic: 0.33, msg: 0, water: 16.66 },
  orange: { citric: 0.9, malic: 0.1, msg: 0, water: 16.66 },
  grapefruit: { citric: 0.8, malic: 0.2, msg: 0.033, water: 16.66 },
  kumquat: { citric: 0.25, malic: 0, msg: 0, water: 16.66 * 0.25 },
};

export function calculateSuperJuice({
  citrus,
  inputWeight,
}: {
  citrus: SuperJuiceCitrus;
  inputWeight: number;
}) {
  const ratios = SUPER_JUICE_RATIOS[citrus];
  const isInputWeightValid = Number.isFinite(inputWeight) && inputWeight > 0;

  const citricAcid = isInputWeightValid ? ratios.citric * inputWeight : Number.NaN;
  const malicAcid = isInputWeightValid ? ratios.malic * inputWeight : Number.NaN;
  const msg = isInputWeightValid ? ratios.msg * inputWeight : Number.NaN;
  const water = isInputWeightValid ? ratios.water * inputWeight : Number.NaN;

  return { citricAcid, malicAcid, msg, water };
}
