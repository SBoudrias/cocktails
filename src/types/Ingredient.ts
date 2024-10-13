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

export type Ingredient = {
  name: string;
  type: IngredientType;
  categories?: string[];
  quantity: {
    amount: number;
    unit: Unit;
  };
};
