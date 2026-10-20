import { formatter } from '../../infra/schemas.ts';
import type { DataWithSchema } from '../../infra/types.ts';
import { writeJSON } from '../../infra/write-json.ts';

/**
 * Applies schema key ordering to a data file, silently rewriting it when the
 * current key order drifts from the schema-defined order.
 */
export async function applyKeyOrdering(
  data: DataWithSchema,
  file: string,
): Promise<void> {
  const originalJson = JSON.stringify(data, null, 2);
  const sortedData = formatter.format(data);
  const sortedJson = JSON.stringify(sortedData, null, 2);
  if (originalJson !== sortedJson) {
    await writeJSON(file, data);
  }
}
