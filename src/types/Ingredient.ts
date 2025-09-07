import { type Category } from './Category';
import { type Ref } from './Ref';

// Note: the json-schema allows "category", it's only included in the Recipe type.
export type IngredientType =
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

type TechniqueInfusion = {
  technique: 'infusion';
  agent: string;
  agent_quantity?: QuantityDetails;
  spirit_quantity?: QuantityDetails;
  duration?: string;
  method?: 'cold' | 'hot' | 'sous-vide';
};

type TechniqueFatWash = {
  technique: 'fat-wash';
  fat: string;
  fat_quantity?: QuantityDetails;
  spirit_quantity?: QuantityDetails;
  duration?: string;
  temperature?: string;
};

type TechniqueMilkWash = {
  technique: 'milk-wash';
  milk_type: string;
  duration?: string;
};

type TechniqueClarification = {
  technique: 'clarification';
  method?: 'milk';
  milk_type?: string;
  agent?: string;
};

type TechniqueTemperature = {
  technique: 'temperature';
  method: 'chilled' | 'hot' | 'frozen' | 'roasted';
};

type TechniqueMuddled = {
  technique: 'muddled';
};

type TechniqueCut = {
  technique: 'cut';
  type:
    | 'chunked'
    | 'cubed'
    | 'disc'
    | 'sliced'
    | 'sectioned'
    | 'diced'
    | 'julienned'
    | 'wheeled'
    | 'wedged'
    | 'peeled'
    | 'zested';
  size?: string;
};

type TechniqueMaturity = {
  technique: 'maturity';
  state: 'ripe' | 'overripe' | 'fresh' | 'aged' | 'dried';
};

type TechniqueApplication = {
  technique: 'application';
  method: 'float' | 'rinse' | 'top';
  instructions?: string;
};

type TechniqueAcidAdjustment = {
  technique: 'acid-adjustment';
};

type TechniqueGelification = {
  technique: 'gelification';
  agent: string;
  concentration?: string;
  setting_time?: string;
};

export type Technique =
  | TechniqueInfusion
  | TechniqueFatWash
  | TechniqueMilkWash
  | TechniqueClarification
  | TechniqueTemperature
  | TechniqueMuddled
  | TechniqueCut
  | TechniqueMaturity
  | TechniqueApplication
  | TechniqueAcidAdjustment
  | TechniqueGelification;

export type RecipeIngredient = (RootIngredient | CategoryIngredient) & {
  quantity: QuantityDetails;
  technique?: Technique | Technique[];
  brix?: number;
};
