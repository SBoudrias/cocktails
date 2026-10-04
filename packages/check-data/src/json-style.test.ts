import { describe, expect, it } from 'vitest';
import { findInlineObjects } from './json-style.ts';

describe('findInlineObjects', () => {
  it('finds a one-line quantity object', () => {
    const inlineObjects = findInlineObjects(`{
  "ingredients": [
    {
      "name": "Lime juice",
      "type": "juice",
      "quantity": { "amount": 0.5, "unit": "oz" }
    }
  ]
}`);

    expect(inlineObjects).toEqual([
      {
        lineNumber: 6,
        line: '"quantity": { "amount": 0.5, "unit": "oz" }',
      },
    ]);
  });

  it('finds a one-line technique object', () => {
    const inlineObjects = findInlineObjects(`{
  "ingredients": [
    {
      "technique": { "technique": "infusion", "agent": "chamomile" },
      "quantity": {
        "amount": 1,
        "unit": "oz"
      }
    }
  ]
}`);

    expect(inlineObjects).toEqual([
      {
        lineNumber: 4,
        line: '"technique": { "technique": "infusion", "agent": "chamomile" },',
      },
    ]);
  });

  it('finds a one-line object entry inside an array', () => {
    const inlineObjects = findInlineObjects(`{
  "refs": [
    { "type": "book", "title": "smugglers-cove", "page": 197 }
  ]
}`);

    expect(inlineObjects).toEqual([
      {
        lineNumber: 3,
        line: '{ "type": "book", "title": "smugglers-cove", "page": 197 }',
      },
    ]);
  });

  it('accepts the expanded convention', () => {
    const inlineObjects = findInlineObjects(`{
  "ingredients": [
    {
      "name": "Lime juice",
      "type": "juice",
      "quantity": {
        "amount": 0.5,
        "unit": "oz"
      },
      "technique": {
        "technique": "infusion",
        "agent": "chamomile"
      }
    }
  ],
  "refs": [
    {
      "type": "book",
      "title": "smugglers-cove"
    }
  ]
}`);

    expect(inlineObjects).toEqual([]);
  });

  it('accepts a one-line array of scalars, like single-line instructions', () => {
    const inlineObjects = findInlineObjects(`{
  "instructions": ["Garnish with a lime wheel."]
}`);

    expect(inlineObjects).toEqual([]);
  });

  it('accepts the top-level opening and closing lines', () => {
    const inlineObjects = findInlineObjects(`{
  "name": "Mai Tai"
}`);

    expect(inlineObjects).toEqual([]);
  });
});
