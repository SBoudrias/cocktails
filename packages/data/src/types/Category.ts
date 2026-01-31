import { type IngredientType } from './Ingredient.ts';
import { type Ref } from './Ref.ts';

export type Category = {
  name: string;
  slug: string;
  description?: string;
  parents: Category[];
  refs: Ref[];
  categoryType?: IngredientType;
  type: 'category';
};
