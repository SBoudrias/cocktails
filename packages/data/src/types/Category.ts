import { type IngredientType } from './Ingredient.ts';
import { type Ref } from './Ref.ts';

export type Category = {
  name: string;
  slug: string;
  description?: string;
  /** False when this category's children don't substitute with each other. */
  substitutable?: boolean;
  /** Categorization systems this category and its subtree are outside of. */
  outsideOf?: string[];
  parents: Category[];
  refs: Ref[];
  categoryType?: IngredientType;
  type: 'category';
};
