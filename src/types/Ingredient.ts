import { Category } from './Category';
import { Ref } from './Ref';

// Note: the json-schema allows "category", it's only included in the Recipe type.
export type IngredientType =
  | 'beer'
  | 'bitter'
  | 'fruit'
  | 'juice'
  | 'liqueur'
  | 'puree'
  | 'soda'
  | 'spice'
  | 'spirit'
  | 'syrup'
  | 'tincture'
  | 'wine'
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
