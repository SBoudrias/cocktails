import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

async function getRecipeValidator() {
  const ajv = new Ajv();
  const schemasGlob = path.join(import.meta.dirname, '*.schema.json');

  for await (const schemaFile of fs.glob(schemasGlob)) {
    const schema = JSON.parse(await fs.readFile(schemaFile, 'utf8'));
    ajv.addSchema(schema, path.basename(schemaFile));
  }

  const validate = ajv.getSchema('recipe.schema.json');
  if (!validate) {
    throw new Error('Recipe schema not registered');
  }

  return validate;
}

const validatePromise = getRecipeValidator();

describe('recipe schema', () => {
  it.each(['syrup', 'spirit', 'category'])(
    'accepts omitted or boolean optional metadata on %s ingredients',
    async (type) => {
      const validate = await validatePromise;

      for (const metadata of [{}, { optional: true }, { optional: false }]) {
        expect(
          validate({
            name: 'Optional Ingredient',
            preparation: 'stirred',
            served_on: 'up',
            glassware: 'coupe',
            ingredients: [
              {
                name: 'Test ingredient',
                type,
                quantity: { amount: 1, unit: 'oz' },
                ...metadata,
              },
            ],
          }),
        ).toBe(true);
      }
    },
  );

  it.each(['syrup', 'spirit', 'category'])(
    'rejects non-boolean optional metadata on %s ingredients',
    async (type) => {
      const validate = await validatePromise;

      for (const optional of ['optional', 1, null]) {
        expect(
          validate({
            name: 'Invalid Optional Ingredient',
            preparation: 'stirred',
            served_on: 'up',
            glassware: 'coupe',
            ingredients: [
              {
                name: 'Test ingredient',
                type,
                quantity: { amount: 1, unit: 'oz' },
                optional,
              },
            ],
          }),
        ).toBe(false);
        expect(validate.errors).toContainEqual(
          expect.objectContaining({
            instancePath: '/ingredients/0/optional',
            keyword: 'type',
            params: { type: 'boolean' },
          }),
        );
      }
    },
  );

  it('requires whole-recipe techniques to use the plural array field', async () => {
    const validate = await validatePromise;

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
    const validate = await validatePromise;

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

  it('accepts structured fat-wash percentage, method, duration, and sous-vide temperature', async () => {
    const validate = await validatePromise;

    for (const technique of [
      { technique: 'fat-wash', fat: 'coconut oil' },
      {
        technique: 'fat-wash',
        fat: 'bacon fat',
        percentage: 6,
        method: 'room-temp',
        duration_minutes: 240,
      },
      {
        technique: 'fat-wash',
        fat: 'coffee oil',
        percentage: 30,
      },
      {
        technique: 'fat-wash',
        fat: 'cacao butter',
        percentage: 10,
        method: 'sous-vide',
        temperature_c: 65,
        duration_minutes: 60,
      },
    ]) {
      expect(
        validate({
          name: 'Fat Wash Test',
          preparation: 'stirred',
          served_on: 'big rock',
          glassware: 'old fashioned',
          ingredients: [
            {
              name: 'Plymouth Gin',
              type: 'spirit',
              technique,
              quantity: { amount: 2, unit: 'oz' },
            },
          ],
        }),
      ).toBe(true);
    }
  });

  it('rejects invalid fat-wash percentage, freezer method, freeze_minutes, or non-sous-vide temperature', async () => {
    const validate = await validatePromise;

    for (const technique of [
      { technique: 'fat-wash', fat: 'bacon fat', percentage: 0 },
      { technique: 'fat-wash', fat: 'bacon fat', percentage: 100 },
      { technique: 'fat-wash', fat: 'bacon fat', percentage: '6%' },
      { technique: 'fat-wash', fat: 'coffee oil', method: 'freezer' },
      { technique: 'fat-wash', fat: 'bacon fat', freeze_minutes: 120 },
      { technique: 'fat-wash', fat: 'bacon fat', temperature_c: 65 },
      {
        technique: 'fat-wash',
        fat: 'bacon fat',
        method: 'room-temp',
        temperature_c: 65,
      },
    ]) {
      expect(
        validate({
          name: 'Invalid Fat Wash Test',
          preparation: 'stirred',
          served_on: 'big rock',
          glassware: 'old fashioned',
          ingredients: [
            {
              name: 'Plymouth Gin',
              type: 'spirit',
              technique,
              quantity: { amount: 2, unit: 'oz' },
            },
          ],
        }),
      ).toBe(false);
    }
  });
});
