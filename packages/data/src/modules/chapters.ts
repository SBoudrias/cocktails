/**
 * Parse chapter folder name: "01_The History of Tiki" → { order: 1, name: "The History of Tiki" }
 */
export function parseChapterFolder(
  folder: string,
): { order: number; name: string } | null {
  const match = folder.match(/^(\d+)_(.+)$/);
  if (!match?.[1] || !match[2]) return null;
  return { order: Number.parseInt(match[1], 10), name: match[2] };
}

/**
 * Check if folder name matches chapter pattern (##_Name)
 */
export function isChapterFolder(folder: string): boolean {
  return /^\d+_.+$/.test(folder);
}
