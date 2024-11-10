import { QuantityDetails } from '@/types/Recipe';

const IMPERIAL_TO_ML = {
  tsp: 5,
  tbsp: 15,
  oz: 30,
};

function shouldConvertUnit(unit: string): unit is keyof typeof IMPERIAL_TO_ML {
  return unit in IMPERIAL_TO_ML;
}

export function convertQuantityToMl(quantity: QuantityDetails): QuantityDetails {
  const unit: string = quantity.unit;
  if (shouldConvertUnit(unit)) {
    return {
      amount: quantity.amount * IMPERIAL_TO_ML[unit],
      unit: 'ml',
    };
  }

  return quantity;
}
