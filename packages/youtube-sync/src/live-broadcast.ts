/**
 * Un-aired live broadcast detection.
 *
 * Channels publish placeholder entries to their uploads playlist before a
 * live stream or premiere has aired. Those entries have no usable recipe
 * content yet: they must not reach issue generation, where they previously
 * kept agents polling a video that would never resolve.
 *
 * A broadcast that has since ended is re-published as a regular VOD with
 * status 'none' (YouTube Data API) or 'was_live' (yt-dlp); those flow
 * through normally, including on the next weekly run.
 */

// YouTube Data API uses 'live' | 'upcoming' | 'none';
// yt-dlp uses 'is_live' | 'is_upcoming' | 'was_live' | 'not_live'.
const UNAIRED_BROADCAST_STATUSES = new Set([
  'live',
  'upcoming',
  'is_live',
  'is_upcoming',
]);

/**
 * Whether the broadcast status marks a video that has not aired as a regular
 * upload yet. Unknown statuses (including undefined) are treated as aired so
 * the filter never drops videos over missing metadata.
 */
export function isUnairedBroadcast(liveBroadcastContent: string | undefined): boolean {
  return (
    liveBroadcastContent != null && UNAIRED_BROADCAST_STATUSES.has(liveBroadcastContent)
  );
}
