/**
 * Generic ingredient names ship lowercase in the data ("lime", "green
 * apple"); every other entity follows sentence case. The list rows that show
 * them start the first character with a capital — the first character only:
 * css `text-transform: capitalize` would title-case every word and corrupt
 * sentence-case names like "Grapefruit peel".
 */
export function sentenceCase(name: string): string {
  const first = name.at(0);
  if (first == null) return name;

  return first.toUpperCase() + name.slice(1);
}
