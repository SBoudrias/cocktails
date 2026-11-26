/**
 * A record with its keys sorted by code unit, so a serialized data file
 * does not depend on input order or locale.
 */
export function toSortedRecord<T>(
  entries: Iterable<readonly [string, T]>,
): Record<string, T> {
  return Object.fromEntries(
    [...entries].toSorted(([a], [b]) => {
      if (a === b) return 0;
      return a < b ? -1 : 1;
    }),
  );
}

/**
 * Serialize a detail pages data file, minified (it is only ever read by
 * `fetch`). Entities carry the `$schema` pointer of their JSON source; it is
 * never rendered, so the file drops it.
 */
export function serializePageData(value: unknown): string {
  return JSON.stringify(value, (key, field: unknown) =>
    key === '$schema' ? undefined : field,
  );
}
