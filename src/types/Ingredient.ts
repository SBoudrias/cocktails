import { Category } from './Category';
import { Ref } from './Ref';

export type IngredientType =
  | 'bitter'
  | 'fruit'
  | 'juice'
  | 'liqueur'
  | 'puree'
  | 'soda'
  | 'spice'
  | 'spirit'
  | 'sugar'
  | 'syrup'
  | 'other';

export type BaseIngredient = {
  name: string;
  slug: string;
  type: IngredientType;
  brix?: number;
  description?: string;
  categories: Category[];
  refs: Ref[];
};
