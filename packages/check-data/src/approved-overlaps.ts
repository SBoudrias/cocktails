/**
 * Registry of name overlaps that have been manually reviewed and confirmed
 * as valid (e.g. two genuinely different people whose names look similar).
 *
 * The registry lives at `packages/data/approved-overlaps.json` and stores a
 * list of validated names per kind. An overlap warning between two names is
 * suppressed only when BOTH names are in the approved list for that kind —
 * validating a single name never hides a warning, so a possible misspelling
 * can't silently disappear behind an approved name.
 */

export const OVERLAP_KINDS = ['author', 'bar'] as const;
export type OverlapKind = (typeof OVERLAP_KINDS)[number];

export type ApprovedOverlaps = Record<OverlapKind, string[]>;

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '');
}

export function isApprovedOverlap(
  approved: ApprovedOverlaps,
  kind: OverlapKind,
  a: string,
  b: string,
): boolean {
  const names = approved[kind] ?? [];
  return names.includes(normalizeName(a)) && names.includes(normalizeName(b));
}

export function validateApprovedOverlaps(
  approved: ApprovedOverlaps,
  existingNames: ReadonlyMap<string, string>,
): string[] {
  const messages: string[] = [];

  for (const kind of OVERLAP_KINDS) {
    const names = approved[kind] ?? [];
    const seen = new Set<string>();

    for (const name of names) {
      const normalized = normalizeName(name);
      if (normalized !== name) {
        messages.push(
          `Approved ${kind} name "${name}" is not normalized; use "${normalized}"`,
        );
      }
      if (seen.has(normalized)) {
        messages.push(`Approved ${kind} name "${name}" is listed more than once`);
      }
      seen.add(normalized);

      if (!existingNames.has(normalized)) {
        messages.push(
          `Approved ${kind} name "${name}" does not match any known ${kind} name`,
        );
      }
    }
  }

  return messages;
}
