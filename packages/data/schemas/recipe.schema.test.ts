import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

async function getRecipeValidator() {
  const ajv = new Ajv();
  const schemasGlob = path.join(import.meta.dirname, '*.schema.json');

  for await (const schemaFile of fs.glob(schemasGlob)) {
    const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
    ajv.addSchema(schema, path.basename(schemaFile));
  }

  const validate = ajv.getSchema('recipe.schema.json');
  if (!validate) {
    throw new Error('Recipe schema not registered');
  }

  return validate;
}

describe('recipe schema', () => {
  it('requires whole-recipe techniques to use the plural array field', async () => {
    const validate = await getRecipeValidator();

    expect(
      validate({
        name: 'Singular Clarification',
        preparation: 'stirred',
        technique: {
          technique: 'clarification',
          method: 'milk',
          milk_type: 'Whole milk',
          quantity: { amount: 4, unit: 'oz' },
        },
        served_on: 'up',
        glassware: 'coupe',
        ingredients: [
          {
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          },
        ],
      }),
    ).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: '',
        keyword: 'additionalProperties',
        params: { additionalProperty: 'technique' },
      }),
    );
  });

  it('rejects duplicate recipe techniques', async () => {
    const validate = await getRecipeValidator();

    expect(
      validate({
        name: 'Duplicate Clarification',
        preparation: 'stirred',
        techniques: [
          {
            technique: 'clarification',
            method: 'milk',
            milk_type: 'Whole milk',
            quantity: { amount: 4, unit: 'oz' },
          },
          {
            technique: 'clarification',
            method: 'milk',
            milk_type: 'Coconut milk',
            quantity: { amount: 2, unit: 'oz' },
          },
        ],
        served_on: 'up',
        glassware: 'coupe',
        ingredients: [
          {
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          },
        ],
      }),
    ).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: '/techniques',
        keyword: 'contains',
        params: expect.objectContaining({ maxContains: 1 }),
      }),
    );
  });
});
