import type { SchemaFormatter } from '@cocktails/jsonschema-formatter';
import type { WriteJSON } from '../../infra/write-json.ts';

/**
 * Applies schema key ordering to a data file, silently rewriting it when the
 * current key order drifts from the schema-defined order.
 */
export async function applyKeyOrdering({
  data,
  file,
  formatter,
  writeJSON,
}: {
  data: object;
  file: string;
  formatter: SchemaFormatter;
  writeJSON: WriteJSON;
}): Promise<void> {
  const originalJson = JSON.stringify(data, null, 2);
  const sortedData = formatter.format(data);
  const sortedJson = JSON.stringify(sortedData, null, 2);
  if (originalJson !== sortedJson) {
    await writeJSON(file, data);
  }
}
