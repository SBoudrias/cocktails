import { describe, expect, it } from 'vitest';
import {
  getMilkClarificationIngredientSlugs,
  validateMilkClarification,
} from './milk-clarification.ts';

const canonicalIngredientNames = new Map([
  ['whole-milk', 'Whole milk'],
  ['coconut-milk', 'Coconut milk'],
]);
const ingredientFolders = new Map([
  ['whole-milk', 'other'],
  ['coconut-milk', 'other'],
]);

describe('validateMilkClarification', () => {
  it('accepts a canonical milk type stored with the recipe technique', () => {
    expect(
      validateMilkClarification(
        {
          ingredients: [],
          techniques: [
            {
              technique: 'clarification',
              method: 'milk',
              milk_type: 'Coconut milk',
              quantity: { amount: 4, unit: 'oz' },
            },
          ],
        },
        canonicalIngredientNames,
        ingredientFolders,
      ),
    ).toEqual([]);
  });

  it('requires the canonical ingredient name', () => {
    expect(
      validateMilkClarification(
        {
          ingredients: [],
          techniques: [
            {
              technique: 'clarification',
              method: 'milk',
              milk_type: 'whole milk',
              quantity: { amount: 4, unit: 'oz' },
            },
          ],
        },
        canonicalIngredientNames,
        ingredientFolders,
      ),
    ).toEqual(['Milk type "whole milk" must use canonical ingredient name "Whole milk"']);
  });

  it('requires the milk type to name a canonical ingredient', () => {
    expect(
      validateMilkClarification(
        {
          ingredients: [],
          techniques: [
            {
              technique: 'clarification',
              method: 'milk',
              milk_type: 'Oat milk',
              quantity: { amount: 4, unit: 'oz' },
            },
          ],
        },
        canonicalIngredientNames,
        ingredientFolders,
      ),
    ).toEqual(['Milk type "Oat milk" is not a canonical ingredient']);
  });

  it('rejects milk duplicated in the recipe ingredients', () => {
    expect(
      validateMilkClarification(
        {
          ingredients: [{ name: 'Whole milk' }],
          techniques: [
            {
              technique: 'clarification',
              method: 'milk',
              milk_type: 'Whole milk',
              quantity: { amount: 4, unit: 'oz' },
            },
          ],
        },
        canonicalIngredientNames,
        ingredientFolders,
      ),
    ).toEqual([
      'Milk type "Whole milk" must be defined only by the recipe technique, not listed as a recipe ingredient',
    ]);
  });

  it('validates every technique in an ordered sequence', () => {
    expect(
      validateMilkClarification(
        {
          ingredients: [],
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
              milk_type: 'coconut milk',
              quantity: { amount: 4, unit: 'oz' },
            },
          ],
        },
        canonicalIngredientNames,
        ingredientFolders,
      ),
    ).toEqual([
      'Milk type "coconut milk" must use canonical ingredient name "Coconut milk"',
    ]);
  });

  it('collects technique milk types as ingredient references', () => {
    expect(
      getMilkClarificationIngredientSlugs({
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
            quantity: { amount: 4, unit: 'oz' },
          },
        ],
      }),
    ).toEqual(['whole-milk', 'coconut-milk']);
  });
});
