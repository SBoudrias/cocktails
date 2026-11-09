/**
 * Group items by the calendar day (YYYY-MM-DD) they were added. Days come
 * newest first; items keep their incoming order within a day, so callers pass
 * them newest first.
 */
export function groupByAddedDay<T>(
  entries: { day: string; item: T }[],
): { day: string; label: string; items: T[] }[] {
  const items = new Map<string, T[]>();
  for (const { day, item } of entries) {
    items.set(day, [...(items.get(day) ?? []), item]);
  }

  return [...items]
    .toSorted(([a], [b]) => b.localeCompare(a))
    .map(([day, items]) => ({ day, label: formatDay(day), items }));
}

function formatDay(day: string): string {
  // Noon UTC rendered in UTC: the calendar day never shifts with the timezone.
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en', {
    dateStyle: 'long',
    timeZone: 'UTC',
  });
}
