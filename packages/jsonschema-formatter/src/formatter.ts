/**
 * JSON Schema-based formatter that sorts object keys according to schema-defined order.
 */

import type { JSONSchema7 } from 'json-schema';
import { parseRefString, parseSchema, type SchemaInfo } from './schema-parser.ts';

export interface SchemaFormatter {
  /**
   * Register a schema. Uses $id for identification.
   */
  addSchema(schema: JSONSchema7): void;

  /**
   * Format data by sorting keys according to registered schemas.
   * Context is inferred from the $schema property at root level.
   */
  format(data: unknown): unknown;
}

function getBasename(path: string): string {
  return path.split('/').pop() ?? path;
}

/**
 * Creates a schema formatter that auto-infers key ordering from registered schemas.
 */
export function createSchemaFormatter(): SchemaFormatter {
  // Map schema basename (e.g., "recipe.schema.json") to parsed info
  const schemas = new Map<string, SchemaInfo>();
  // Raw schemas for $ref resolution
  const rawSchemas = new Map<string, JSONSchema7>();

  function resolveRef(ref: string): JSONSchema7 | undefined {
    const { basename, pointer } = parseRefString(ref);
    const schema = rawSchemas.get(basename);
    if (!schema) return undefined;

    // If there's a JSON pointer, navigate to that part of the schema
    if (pointer) {
      return resolvePointer(schema, pointer);
    }

    return schema;
  }

  function resolvePointer(schema: JSONSchema7, pointer: string): JSONSchema7 | undefined {
    // Parse JSON pointer like "/properties/ingredients"
    const parts = pointer.split('/').filter(Boolean);
    let current: unknown = schema;

    for (const part of parts) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
      return current as JSONSchema7;
    }

    return undefined;
  }

  function addSchema(schema: JSONSchema7): void {
    const id = schema.$id;
    if (!id) {
      throw new Error('Schema must have an $id property');
    }
    const basename = getBasename(id);
    rawSchemas.set(basename, schema);
    schemas.set(basename, parseSchema(schema, resolveRef));
  }

  function format(data: unknown): unknown {
    return formatValue(data, undefined);
  }

  function formatValue(value: unknown, schemaInfo: SchemaInfo | undefined): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => formatValue(item, schemaInfo));
    }

    if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      // Determine schema from $schema property at root
      let effectiveSchemaInfo = schemaInfo;
      if (!effectiveSchemaInfo && typeof record.$schema === 'string') {
        const schemaBasename = getBasename(record.$schema);
        effectiveSchemaInfo = schemas.get(schemaBasename);
      }

      // Handle discriminated unions - select the right variant
      if (effectiveSchemaInfo?.discriminator && effectiveSchemaInfo.variants) {
        const discriminatorValue = record[effectiveSchemaInfo.discriminator];
        if (typeof discriminatorValue === 'string') {
          const variantInfo = effectiveSchemaInfo.variants.get(discriminatorValue);
          if (variantInfo) {
            effectiveSchemaInfo = variantInfo;
          }
        }
      }

      const keyOrder = effectiveSchemaInfo?.keys ?? [];
      const sorted: Record<string, unknown> = {};

      // Add keys in schema-defined order
      for (const key of keyOrder) {
        if (key in record) {
          sorted[key] = formatProperty(record[key], key, effectiveSchemaInfo);
        }
      }

      // Add remaining keys alphabetically
      for (const key of Object.keys(record).toSorted()) {
        if (!(key in sorted)) {
          sorted[key] = formatProperty(record[key], key, effectiveSchemaInfo);
        }
      }

      return sorted;
    }

    return value;
  }

  function isSchema(def: unknown): def is JSONSchema7 {
    return typeof def === 'object' && def !== null && !Array.isArray(def);
  }

  function resolveRefToSchemaInfo(ref: string): SchemaInfo | undefined {
    const { basename, pointer } = parseRefString(ref);
    // If no pointer, use the cached parsed schema
    if (!pointer) {
      return schemas.get(basename);
    }
    // If there's a pointer, resolve the sub-schema and parse it
    const resolvedSchema = resolveRef(ref);
    if (resolvedSchema) {
      // If the resolved schema is an array type, parse its items schema instead
      if (resolvedSchema.type === 'array' && isSchema(resolvedSchema.items)) {
        return parseSchema(resolvedSchema.items, resolveRef);
      }
      return parseSchema(resolvedSchema, resolveRef);
    }
    return undefined;
  }

  function formatProperty(
    value: unknown,
    key: string,
    parentSchemaInfo: SchemaInfo | undefined,
  ): unknown {
    if (!parentSchemaInfo) {
      return formatValue(value, undefined);
    }

    // Check if this property references another schema
    const refString = parentSchemaInfo.refs.get(key);
    if (refString) {
      const refSchemaInfo = resolveRefToSchemaInfo(refString);
      if (refSchemaInfo) {
        return formatValue(value, refSchemaInfo);
      }
    }

    // Check if this is an array with defined item schema
    if (Array.isArray(value)) {
      const itemSchemaInfo = parentSchemaInfo.arrayItems.get(key);
      if (itemSchemaInfo) {
        return value.map((item) => formatValue(item, itemSchemaInfo));
      }

      // Check for array items that reference another schema
      const arrayRefString = parentSchemaInfo.refs.get(`${key}[]`);
      if (arrayRefString) {
        const refSchemaInfo = resolveRefToSchemaInfo(arrayRefString);
        if (refSchemaInfo) {
          return value.map((item) => formatValue(item, refSchemaInfo));
        }
      }
    }

    return formatValue(value, undefined);
  }

  return { addSchema, format };
}
