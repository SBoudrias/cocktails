export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Int32Array(n + 1);
  let curr = new Int32Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j]! + 1;
      const ins = curr[j - 1]! + 1;
      const sub = prev[j - 1]! + cost;
      curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n]!;
}

// Reusable scratch buffers for banded Levenshtein (single-threaded check-data).
let bandPrev = new Int32Array(128);
let bandCurr = new Int32Array(128);

function ensureBandCapacity(size: number): void {
  if (bandPrev.length < size) {
    bandPrev = new Int32Array(size);
    bandCurr = new Int32Array(size);
  }
}

/**
 * Exact Levenshtein distance when `distance <= maxDist`, or `maxDist + 1` once
 * the edit distance is proven to exceed `maxDist` (Ukkonen banded DP).
 */
function levenshteinWithin(a: string, b: string, maxDist: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;

  // Strip common prefix and suffix to shrink the DP band.
  let start = 0;
  const minLen = m < n ? m : n;
  while (start < minLen && a.charCodeAt(start) === b.charCodeAt(start)) start++;

  let endA = m;
  let endB = n;
  while (
    endA > start &&
    endB > start &&
    a.charCodeAt(endA - 1) === b.charCodeAt(endB - 1)
  ) {
    endA--;
    endB--;
  }

  const lenA = endA - start;
  const lenB = endB - start;
  if (lenA === 0) return lenB <= maxDist ? lenB : maxDist + 1;
  if (lenB === 0) return lenA <= maxDist ? lenA : maxDist + 1;

  ensureBandCapacity(lenB + 1);
  const INF = maxDist + 1;
  for (let j = 0; j <= lenB; j++) bandPrev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    const from = Math.max(1, i - maxDist);
    const to = Math.min(lenB, i + maxDist);
    bandCurr[0] = i;
    if (from > 1) bandCurr[from - 1] = INF;

    const ca = a.charCodeAt(start + i - 1);
    let rowMin = INF;
    for (let j = from; j <= to; j++) {
      const cost = ca === b.charCodeAt(start + j - 1) ? 0 : 1;
      const del = j <= i - 1 + maxDist ? bandPrev[j]! + 1 : INF;
      const ins = bandCurr[j - 1]! + 1;
      const sub = bandPrev[j - 1]! + cost;
      const val = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
      bandCurr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return INF;

    const tmp = bandPrev;
    bandPrev = bandCurr;
    bandCurr = tmp;
  }

  return bandPrev[lenB]! <= maxDist ? bandPrev[lenB]! : INF;
}

export function areSimilarNames(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return false;
  const lenA = la.length;
  const lenB = lb.length;
  const minLen = lenA < lenB ? lenA : lenB;
  if (minLen < 4) return false;
  const maxLen = lenA > lenB ? lenA : lenB;
  // Equivalent to `dist <= 2 && dist / maxLen <= 0.25`.
  const maxDist = maxLen >= 8 ? 2 : 1;
  if (Math.abs(lenA - lenB) > maxDist) return false;
  const dist = levenshteinWithin(la, lb, maxDist);
  return dist > 0 && dist <= maxDist;
}
