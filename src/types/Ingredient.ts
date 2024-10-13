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

export type IngredientCategory = {
  name: string;
  substitutes: string[];
};

export type Ingredient = {
  name: string;
  type: IngredientType;
  categories?: IngredientCategory[];
  quantity: {
    amount: number;
    unit: Unit;
  };
};
