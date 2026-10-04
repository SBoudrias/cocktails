/**
 * JSON style check: objects in data files must be expanded over multiple
 * lines, with one member per line. `oxfmt` preserves author line breaks, so an
 * inline object like `"quantity": { "amount": 0.5, "unit": "oz" }` passes
 * format checks even though the repo convention is the expanded shape.
 */

// A member whose object value is serialized inline:
// `"quantity": { "amount": 0.5, "unit": "oz" },`
const INLINE_OBJECT_VALUE = /^\s*"[^"]*":\s*\{.*\}\s*,?\s*$/;
// An object serialized inline inside an array:
// `{ "type": "book", "title": "x" },`
const INLINE_ARRAY_ENTRY = /^\s*\{.*\}\s*,?\s*$/;

export interface InlineObject {
  /** 1-based line number of the offending line */
  lineNumber: number;
  /** The offending line, trimmed */
  line: string;
}

export function findInlineObjects(fileContent: string): InlineObject[] {
  const inlineObjects: InlineObject[] = [];
  for (const [index, line] of fileContent.split('\n').entries()) {
    if (INLINE_OBJECT_VALUE.test(line) || INLINE_ARRAY_ENTRY.test(line)) {
      inlineObjects.push({ lineNumber: index + 1, line: line.trim() });
    }
  }
  return inlineObjects;
}
