import { Category } from './Category';
import { Ref } from './Ref';

// Note: the json-schema allows "category", it's only included in the Recipe type.
type IngredientType =
  | 'beer'
  | 'bitter'
  | 'emulsifier'
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

type QuantityDetails = {
  amount: number;
  unit: Unit;
};

export type BaseIngredient = {
  name: string;
  slug: string;
  type: IngredientType;
  brix?: number;
  description?: string;
  categories: Category[];
  refs: Ref[];
};

type CategoryIngredient = Category & { type: 'category' };

export type RecipeIngredient = (BaseIngredient | CategoryIngredient) & {
  quantity: QuantityDetails;
  preparation?: string;
};

export type RootIngredient = BaseIngredient & {
  ingredients: RecipeIngredient[];
};
