/**
 * Short-form (YouTube Shorts / TikTok-style) video detection.
 *
 * Short-form videos are usually recuts of full episodes. They are only
 * interesting when no long-form video covers the same content.
 */

const SHORT_MAX_DURATION_SECONDS = 180;

const TITLE_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'best',
  'for',
  'how',
  'in',
  'is',
  'it',
  'make',
  'making',
  'new',
  'of',
  'or',
  'short',
  'shorts',
  'the',
  'this',
  'that',
  'to',
  'with',
  'you',
  'your',
]);

export type VideoLike = {
  title: string;
  duration?: number | undefined;
};

/**
 * A video is short-form when the title carries the #shorts hashtag or the
 * duration fits the current YouTube Shorts limit (3 minutes).
 */
export function isShortFormVideo(video: VideoLike): boolean {
  if (/#shorts?\b/i.test(video.title)) return true;

  return video.duration != null && video.duration <= SHORT_MAX_DURATION_SECONDS;
}

function toTitleTokens(title: string): string[] {
  return title
    .replace(/#\S+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !TITLE_STOP_WORDS.has(token));
}

/**
 * Whether one of `videos` is a long-form video covering the same content as
 * `short`, matched by title similarity (most of the short's meaningful title
 * words appear in a long-form video's title).
 */
export function hasLongFormEquivalent(
  short: VideoLike,
  videos: ReadonlyArray<VideoLike>,
): boolean {
  const shortTokens = new Set(toTitleTokens(short.title));
  if (shortTokens.size === 0) return false;

  return videos.some((video) => {
    if (isShortFormVideo(video)) return false;

    const tokens = toTitleTokens(video.title);
    if (tokens.length === 0) return false;

    const matched = tokens.filter((token) => shortTokens.has(token)).length;
    if (matched < 2) return false;

    const shortMatched = [...shortTokens].filter((token) =>
      tokens.includes(token),
    ).length;

    return shortMatched >= Math.ceil(shortTokens.size / 2);
  });
}
