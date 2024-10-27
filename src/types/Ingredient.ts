import { Category } from './Category';
import { Ref } from './Ref';

export type IngredientType =
  | 'bitter'
  | 'category'
  | 'juice'
  | 'liqueur'
  | 'puree'
  | 'soda'
  | 'spice'
  | 'spirit'
  | 'sugar'
  | 'syrup'
  | 'other';
export type Unit = 'oz' | 'ml' | 'dash' | 'tsp' | 'tbsp' | 'drop';

export type BaseIngredient = {
  name: string;
  slug: string;
  type: IngredientType;
  brix?: number;
  description?: string;
  categories: Category[];
  refs?: Ref[];
};

export type RecipeIngredient = BaseIngredient & {
  quantity: {
    amount: number;
    unit: Unit;
  };
};
