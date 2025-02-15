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
  description?: string;
  categories: Category[];
  refs: Ref[];
};

type Juice = BaseIngredient & {
  type: 'juice';
  acidity?: number;
};

type CategoryIngredient = Category & { type: 'category' };

export type RootIngredient = (BaseIngredient | Juice) & {
  ingredients: RecipeIngredient[];
};

export type RecipeIngredient = (RootIngredient | CategoryIngredient) & {
  quantity: QuantityDetails;
  preparation?: string;
  brix?: number;
};
