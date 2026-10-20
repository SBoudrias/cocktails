import type { SortableIngredient } from '@cocktails/ingredient-sorting';
import type { DataContext } from './data-context.ts';
import type { Report } from './report.ts';
import type { WriteJSON } from './write-json.ts';

export interface Ingredient extends SortableIngredient {
  type: string;
  name: string;
  brix?: number;
}

export interface Attribution {
  relation: string;
  source: string;
  location?: string;
}

export interface DataWithSchema {
  $schema: string;
  name: string;
  type?: string;
  ingredients?: Ingredient[];
  attributions?: Attribution[];
  categories?: string[];
  parents?: string[];
  refs?: Array<{ type: string; channel?: string }>;
  sources?: Array<{ type: string; slug: string }>;

  techniques?: Array<{
    technique: 'clarification';
    method: 'milk';
    milk_type: string;
    quantity: { amount: number; unit: string };
  }>;
}

/** The parsed file plus everything the per-file checks need. */
export interface FileCheckInput {
  data: DataWithSchema;
  /** The file's original glob path, even if a rename autofix moved it. */
  file: string;
  /** The schema path, e.g. "schemas/recipe.schema.json". */
  schemaPath: string;
  /** Whether the ajv validation passed; some checks only run on valid files. */
  isValid: boolean | Promise<unknown>;
  ctx: DataContext;
  report: Report;
  writeJSON: WriteJSON;
}
