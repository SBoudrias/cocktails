export type IngredientType = 'spirit' | 'juice' | 'syrup' | 'liqueur';
export type Unit = 'oz' | 'ml' | 'dash';

export type Ingredient = {
  name: string;
  type: IngredientType;
  quantity: {
    amount: number;
    unit: Unit;
  };
};
