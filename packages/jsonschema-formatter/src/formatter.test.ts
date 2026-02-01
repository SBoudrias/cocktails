import { describe, it, expect } from 'vitest';
import { createSchemaFormatter } from './formatter.ts';

describe('createSchemaFormatter', () => {
  describe('key extraction from properties', () => {
    it('sorts keys according to schema property order', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './test.schema.json',
        type: 'object',
        properties: {
          $schema: { type: 'string' },
          first: { type: 'string' },
          second: { type: 'string' },
          third: { type: 'string' },
        },
      });

      const result = formatter.format({
        $schema: './test.schema.json',
        third: 'c',
        first: 'a',
        second: 'b',
      });

      expect(Object.keys(result as object)).toEqual([
        '$schema',
        'first',
        'second',
        'third',
      ]);
    });

    it('places remaining keys alphabetically after schema-defined keys', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './test.schema.json',
        type: 'object',
        properties: {
          $schema: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
        },
      });

      const result = formatter.format({
        $schema: './test.schema.json',
        zebra: 'z',
        name: 'test',
        apple: 'a',
        type: 'foo',
      });

      expect(Object.keys(result as object)).toEqual([
        '$schema',
        'name',
        'type',
        'apple',
        'zebra',
      ]);
    });
  });

  describe('oneOf/anyOf key merging', () => {
    it('merges keys from all oneOf variants preserving order', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './test.schema.json',
        oneOf: [
          {
            type: 'object',
            properties: {
              $schema: { type: 'string' },
              name: { type: 'string' },
              variantA: { type: 'string' },
            },
          },
          {
            type: 'object',
            properties: {
              $schema: { type: 'string' },
              name: { type: 'string' },
              variantB: { type: 'string' },
            },
          },
        ],
      });

      const result = formatter.format({
        $schema: './test.schema.json',
        variantB: 'b',
        name: 'test',
      });

      // $schema and name come first (from first variant), then variantB
      expect(Object.keys(result as object)).toEqual(['$schema', 'name', 'variantB']);
    });
  });

  describe('$ref resolution', () => {
    it('uses referenced schema key ordering for nested objects', () => {
      const formatter = createSchemaFormatter();

      formatter.addSchema({
        $id: './quantity.schema.json',
        type: 'object',
        properties: {
          amount: { type: 'number' },
          unit: { type: 'string' },
        },
      });

      formatter.addSchema({
        $id: './recipe.schema.json',
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { $ref: './quantity.schema.json' },
        },
      });

      const result = formatter.format({
        $schema: './recipe.schema.json',
        quantity: { unit: 'oz', amount: 2 },
        name: 'test',
      });

      expect(result).toEqual({
        $schema: './recipe.schema.json',
        name: 'test',
        quantity: { amount: 2, unit: 'oz' },
      });
    });
  });

  describe('discriminated unions', () => {
    it('detects discriminator from const values and applies variant-specific ordering', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './ref.schema.json',
        anyOf: [
          {
            type: 'object',
            properties: {
              type: { const: 'youtube' },
              videoId: { type: 'string' },
              start: { type: 'number' },
            },
          },
          {
            type: 'object',
            properties: {
              type: { const: 'book' },
              title: { type: 'string' },
              page: { type: 'number' },
            },
          },
        ],
      });

      // For discriminated unions without $schema in variants, remaining keys sorted alphabetically
      const youtube = formatter.format({
        $schema: './ref.schema.json',
        start: 120,
        type: 'youtube',
        videoId: 'abc123',
      });

      expect(Object.keys(youtube as object)).toEqual([
        'type',
        'videoId',
        'start',
        '$schema',
      ]);

      const book = formatter.format({
        $schema: './ref.schema.json',
        page: 42,
        type: 'book',
        title: 'Test Book',
      });

      expect(Object.keys(book as object)).toEqual(['type', 'title', 'page', '$schema']);
    });
  });

  describe('array items', () => {
    it('formats array items according to item schema', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './test.schema.json',
        type: 'object',
        properties: {
          name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                value: { type: 'string' },
              },
            },
          },
        },
      });

      const result = formatter.format({
        $schema: './test.schema.json',
        items: [
          { value: 'a', id: 1 },
          { value: 'b', id: 2 },
        ],
        name: 'test',
      });

      expect(result).toEqual({
        $schema: './test.schema.json',
        name: 'test',
        items: [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' },
        ],
      });
    });

    it('handles discriminated unions in array items', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './test.schema.json',
        type: 'object',
        properties: {
          refs: {
            type: 'array',
            items: {
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    type: { const: 'youtube' },
                    videoId: { type: 'string' },
                    start: { type: 'number' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    type: { const: 'website' },
                    name: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              ],
            },
          },
        },
      });

      const result = formatter.format({
        $schema: './test.schema.json',
        refs: [
          { start: 10, videoId: 'abc', type: 'youtube' },
          { url: 'https://example.com', type: 'website', name: 'Example' },
        ],
      });

      const refs = (result as { refs: object[] }).refs;
      expect(Object.keys(refs[0]!)).toEqual(['type', 'videoId', 'start']);
      expect(Object.keys(refs[1]!)).toEqual(['type', 'name', 'url']);
    });
  });

  describe('$schema path matching', () => {
    it('matches schema by basename regardless of path', () => {
      const formatter = createSchemaFormatter();
      formatter.addSchema({
        $id: './recipe.schema.json',
        type: 'object',
        properties: {
          $schema: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
        },
      });

      const result = formatter.format({
        $schema: '../../../schemas/recipe.schema.json',
        type: 'test',
        name: 'Test Recipe',
      });

      expect(Object.keys(result as object)).toEqual(['$schema', 'name', 'type']);
    });
  });

  describe('nested objects without $ref', () => {
    it('recursively processes nested objects even without schema info', () => {
      const formatter = createSchemaFormatter();

      const result = formatter.format({
        zebra: 'z',
        nested: { charlie: 'c', alpha: 'a', bravo: 'b' },
        apple: 'a',
      });

      expect(result).toEqual({
        apple: 'a',
        nested: { alpha: 'a', bravo: 'b', charlie: 'c' },
        zebra: 'z',
      });
    });
  });

  describe('error handling', () => {
    it('throws if schema has no $id', () => {
      const formatter = createSchemaFormatter();

      expect(() => {
        formatter.addSchema({
          type: 'object',
          properties: { name: { type: 'string' } },
        });
      }).toThrow('Schema must have an $id property');
    });
  });
});
