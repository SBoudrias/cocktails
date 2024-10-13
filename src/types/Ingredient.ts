export type IngredientType = 'spirit' | 'juice' | 'syrup' | 'liqueur';
export type Unit = 'oz' | 'ml' | 'dash' | 'tsp' | 'tbsp' | 'drop';

export type Ingredient = {
  name: string;
  type: IngredientType;
  quantity: {
    amount: number;
    unit: Unit;
  };
};
