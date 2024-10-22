import { Ref } from './Ref';

export type IngredientType =
  | 'spirit'
  | 'juice'
  | 'syrup'
  | 'liqueur'
  | 'bitter'
  | 'puree'
  | 'sugar'
  | 'water'
  | 'other';
export type Unit = 'oz' | 'ml' | 'dash' | 'tsp' | 'tbsp' | 'drop';

export type BaseIngredient = {
  name: string;
  slug: string;
  type: IngredientType;
  brix?: number;
  description?: string;
  categories?: string[];
  refs?: Ref[];
};

export type RecipeIngredient = BaseIngredient & {
  quantity: {
    amount: number;
    unit: Unit;
  };
};
