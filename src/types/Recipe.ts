import { Ingredient } from './Ingredient';

export type Recipe = {
  name: string;
  slug: string;
  ingredients: Ingredient[];
};
