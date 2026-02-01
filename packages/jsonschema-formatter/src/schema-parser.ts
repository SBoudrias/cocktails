/**
 * Schema parsing utilities for extracting key ordering from JSON Schema files.
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

export interface SchemaInfo {
  /** Keys in their schema-defined order */
  keys: string[];
  /** Property name to referenced schema $ref (full ref string including JSON pointer) */
  refs: Map<string, string>;
  /** Array property name to its item schema info */
  arrayItems: Map<string, SchemaInfo>;
  /** For discriminated unions: discriminator property name */
  discriminator?: string;
  /** For discriminated unions: variant value -> SchemaInfo */
  variants?: Map<string, SchemaInfo>;
}

function isSchema(
  def: JSONSchema7Definition | JSONSchema7Definition[] | undefined,
): def is JSONSchema7 {
  return typeof def === 'object' && def !== null && !Array.isArray(def);
}

export interface RefInfo {
  basename: string;
  pointer?: string;
}

export function parseRefString(ref: string): RefInfo {
  // Handle both "./quantity.schema.json" and "./recipe.schema.json#/properties/ingredients"
  const [path, fragment] = ref.split('#');
  const basename = (path ?? ref).split('/').pop() ?? path ?? ref;
  return { basename, pointer: fragment };
}

/**
 * Extract the discriminator property from a union schema.
 * Looks for a property with a `const` value in ALL variants.
 * Only returns a discriminator if every variant has a const value for the same property.
 */
function findDiscriminator(variants: JSONSchema7[]): string | undefined {
  if (variants.length === 0) return undefined;

  // Find properties that have `const` values in the first variant
  const firstVariant = variants[0];
  if (!firstVariant?.properties) return undefined;

  for (const [key, propDef] of Object.entries(firstVariant.properties)) {
    if (!isSchema(propDef) || propDef.const === undefined) continue;

    // Check if ALL variants have a const value for this property
    const allHaveConst = variants.every((variant) => {
      const prop = variant.properties?.[key];
      return isSchema(prop) && prop.const !== undefined;
    });

    if (allHaveConst) {
      return key;
    }
  }
  return undefined;
}

/**
 * Extract keys from a schema, handling oneOf/anyOf by merging keys.
 */
export function extractKeysFromSchema(schema: JSONSchema7): string[] {
  if (schema.properties) {
    return Object.keys(schema.properties);
  }
  // For oneOf/anyOf, merge all property keys preserving order
  const unionVariants = schema.oneOf ?? schema.anyOf ?? [];
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const variant of unionVariants) {
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

function processProperties(
  properties: Record<string, JSONSchema7Definition>,
  refs: Map<string, string>,
  arrayItems: Map<string, SchemaInfo>,
  resolveRef?: (ref: string) => JSONSchema7 | undefined,
): void {
  for (const [key, propDef] of Object.entries(properties)) {
    if (!isSchema(propDef)) continue;

    // Handle $ref - store the full ref string
    if (propDef.$ref) {
      refs.set(key, propDef.$ref);
    }

    // Handle array items
    if (propDef.type === 'array' && propDef.items) {
      const itemsDef = propDef.items;
      if (isSchema(itemsDef)) {
        // Check for discriminated union in array items
        const itemUnionVariants = itemsDef.anyOf ?? itemsDef.oneOf;
        if (itemUnionVariants) {
          const itemSchemaVariants = itemUnionVariants.filter(isSchema);
          const itemDiscriminator = findDiscriminator(itemSchemaVariants);
          if (itemDiscriminator) {
            const itemVariants = new Map<string, SchemaInfo>();
            for (const variant of itemSchemaVariants) {
              const discProp = variant.properties?.[itemDiscriminator];
              if (isSchema(discProp) && typeof discProp.const === 'string') {
                itemVariants.set(discProp.const, parseSchema(variant, resolveRef));
              }
            }
            arrayItems.set(key, {
              keys: extractKeysFromSchema(itemsDef),
              refs: new Map(),
              arrayItems: new Map(),
              discriminator: itemDiscriminator,
              variants: itemVariants,
            });
          } else {
            arrayItems.set(key, parseSchema(itemsDef, resolveRef));
          }
        } else if (itemsDef.$ref) {
          // Items reference another schema - store full ref string
          refs.set(`${key}[]`, itemsDef.$ref);
        } else {
          arrayItems.set(key, parseSchema(itemsDef, resolveRef));
        }
      }
    }

    // Handle oneOf/anyOf in property (like technique can be single or array)
    const propUnion = propDef.oneOf ?? propDef.anyOf;
    if (propUnion) {
      for (const variant of propUnion) {
        if (isSchema(variant) && variant.$ref) {
          refs.set(key, variant.$ref);
          break;
        }
      }
    }
  }
}

/**
 * Parse a schema and extract structural information for formatting.
 */
export function parseSchema(
  schema: JSONSchema7,
  resolveRef?: (ref: string) => JSONSchema7 | undefined,
): SchemaInfo {
  const refs = new Map<string, string>();
  const arrayItems = new Map<string, SchemaInfo>();
  let discriminator: string | undefined;
  let variants: Map<string, SchemaInfo> | undefined;

  // Check for discriminated union at the top level (for technique, etc.)
  const topUnionVariants = schema.oneOf ?? schema.anyOf;
  if (topUnionVariants && !schema.properties) {
    const schemaVariants = topUnionVariants.filter(isSchema);
    discriminator = findDiscriminator(schemaVariants);
    if (discriminator) {
      // Discriminated union - store variant-specific schemas
      variants = new Map();
      for (const variant of schemaVariants) {
        const discProp = variant.properties?.[discriminator];
        if (isSchema(discProp) && typeof discProp.const === 'string') {
          variants.set(discProp.const, parseSchema(variant, resolveRef));
        }
      }
    } else {
      // Non-discriminated union - merge refs and arrayItems from all variants
      for (const variant of schemaVariants) {
        if (variant.properties) {
          processProperties(variant.properties, refs, arrayItems, resolveRef);
        }
      }
    }
  }

  // Process direct properties
  if (schema.properties) {
    processProperties(schema.properties, refs, arrayItems, resolveRef);
  }

  return {
    keys: extractKeysFromSchema(schema),
    refs,
    arrayItems,
    discriminator,
    variants,
  };
}
