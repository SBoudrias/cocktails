export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
  return dp[m]![n]!;
}

export function areSimilarNames(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return false;
  if (Math.min(la.length, lb.length) < 4) return false;
  const dist = levenshtein(la, lb);
  return dist > 0 && dist <= 2 && dist / Math.max(la.length, lb.length) <= 0.25;
}
