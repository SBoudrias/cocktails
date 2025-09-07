import { type IngredientType } from './Ingredient';
import { type Ref } from './Ref';

export type Category = {
  name: string;
  slug: string;
  description?: string;
  parents: Category[];
  refs: Ref[];
  categoryType?: IngredientType;
  type: 'category';
};
