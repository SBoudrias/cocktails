/**
 * Utility for extracting and applying JSON key ordering from JSON Schema files.
 * Ensures JSON data files have consistent key ordering matching their schemas.
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

function isSchema(
  def: JSONSchema7Definition | JSONSchema7Definition[] | undefined,
): def is JSONSchema7 {
  return typeof def === 'object' && def !== null && !Array.isArray(def);
}

function extractKeysFromSchema(schema: JSONSchema7): string[] {
  if (schema.properties) {
    return Object.keys(schema.properties);
  }
  // For oneOf/anyOf, merge all property keys preserving order
  const variants = schema.oneOf ?? schema.anyOf ?? [];
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const variant of variants) {
    if (isSchema(variant)) {
      for (const key of extractKeysFromSchema(variant)) {
        if (!seen.has(key)) {
          seen.add(key);
          keys.push(key);
        }
      }
    }
  }
  return keys;
}

export type KeyOrders = Record<string, string[]>;

/**
 * Creates a key orders registry from JSON Schema files.
 */
export function createKeyOrdersRegistry(): {
  keyOrders: KeyOrders;
  registerSchema: (schemaId: string, schema: JSONSchema7) => void;
} {
  const keyOrders: KeyOrders = {};

  function registerSchema(schemaId: string, schema: JSONSchema7): void {
    const baseName = schemaId.replace('.schema.json', '');

    // Special handling for quantity schema
    if (baseName === 'quantity') {
      keyOrders['quantity'] = extractKeysFromSchema(schema);
      return;
    }

    // Top-level schema
    keyOrders[baseName] = extractKeysFromSchema(schema);

    // Nested definitions for recipe schema
    if (baseName === 'recipe') {
      // Recipe ingredients (inside items.oneOf)
      const ingredientItems = schema.properties?.ingredients;
      if (isSchema(ingredientItems) && isSchema(ingredientItems.items)) {
        keyOrders['recipe-ingredient'] = extractKeysFromSchema(ingredientItems.items);
      }

      // Attributions (inside items.oneOf)
      const attributionItems = schema.properties?.attributions;
      if (isSchema(attributionItems) && isSchema(attributionItems.items)) {
        keyOrders['attribution'] = extractKeysFromSchema(attributionItems.items);
      }

      // Refs (inside items.anyOf) - each ref type separately
      const refsItems = schema.properties?.refs;
      if (isSchema(refsItems) && isSchema(refsItems.items)) {
        const refVariants = refsItems.items.anyOf ?? [];
        for (const variant of refVariants) {
          if (isSchema(variant) && variant.properties) {
            const typeProp = variant.properties.type;
            const typeConst = isSchema(typeProp) ? typeProp.const : undefined;
            if (typeof typeConst === 'string') {
              keyOrders[`ref-${typeConst}`] = Object.keys(variant.properties);
            }
          }
        }
      }
    }
  }

  return { keyOrders, registerSchema };
}

function getChildContext(parentContext: string, key: string): string {
  if (
    key === 'ingredients' &&
    (parentContext === 'recipe' || parentContext === 'ingredient')
  ) {
    return 'recipe-ingredient-array';
  }
  if (parentContext === 'recipe-ingredient-array') {
    return 'recipe-ingredient';
  }
  if (key === 'quantity') {
    return 'quantity';
  }
  if (key === 'technique') {
    return 'technique';
  }
  if (key === 'attributions') {
    return 'attribution-array';
  }
  if (parentContext === 'attribution-array') {
    return 'attribution';
  }
  if (key === 'refs') {
    return 'refs-array';
  }
  if (parentContext === 'refs-array') {
    return 'ref-item';
  }
  return 'unknown';
}

function getRefContext(obj: Record<string, unknown>): string {
  if (obj.type === 'youtube') return 'ref-youtube';
  if (obj.type === 'book') return 'ref-book';
  if (obj.type === 'website') return 'ref-website';
  if (obj.type === 'podcast') return 'ref-podcast';
  return 'unknown';
}

export function getSchemaContext(schemaPath: string): string {
  if (schemaPath.endsWith('recipe.schema.json')) return 'recipe';
  if (schemaPath.endsWith('ingredient.schema.json')) return 'ingredient';
  if (schemaPath.endsWith('category.schema.json')) return 'category';
  if (schemaPath.endsWith('book.schema.json')) return 'book';
  if (schemaPath.endsWith('podcast.schema.json')) return 'podcast';
  if (schemaPath.endsWith('youtube-channel.schema.json')) return 'youtube-channel';
  return 'unknown';
}

/**
 * Recursively sorts object keys based on the schema-defined order.
 * Context is inferred from `$schema` property at root level.
 */
function getArrayItemContext(arrayContext: string): string {
  // Map array contexts to their item contexts
  if (arrayContext === 'refs-array') return 'ref-item';
  if (arrayContext === 'attribution-array') return 'attribution';
  if (arrayContext === 'recipe-ingredient-array') return 'recipe-ingredient';
  // Default: strip '-array' suffix
  return arrayContext.endsWith('-array') ? arrayContext.slice(0, -6) : arrayContext;
}

export function sortObjectKeys(
  obj: unknown,
  keyOrders: KeyOrders,
  context?: string,
): unknown {
  if (Array.isArray(obj)) {
    const itemContext = context ? getArrayItemContext(context) : context;
    return obj.map((item) => sortObjectKeys(item, keyOrders, itemContext));
  }
  if (obj !== null && typeof obj === 'object') {
    const record = obj as Record<string, unknown>;

    // Infer context from $schema at root level
    let effectiveContext =
      context ??
      (typeof record.$schema === 'string' ? getSchemaContext(record.$schema) : 'unknown');

    // Determine the actual context for ref items
    if (effectiveContext === 'ref-item') {
      effectiveContext = getRefContext(record);
    }

    const order = keyOrders[effectiveContext] ?? [];
    const sorted: Record<string, unknown> = {};

    // Add keys in defined order first
    for (const key of order) {
      if (key in record) {
        sorted[key] = sortObjectKeys(
          record[key],
          keyOrders,
          getChildContext(effectiveContext, key),
        );
      }
    }

    // Add remaining keys alphabetically
    for (const key of Object.keys(record).toSorted()) {
      if (!(key in sorted)) {
        sorted[key] = sortObjectKeys(
          record[key],
          keyOrders,
          getChildContext(effectiveContext, key),
        );
      }
    }

    return sorted;
  }
  return obj;
}
