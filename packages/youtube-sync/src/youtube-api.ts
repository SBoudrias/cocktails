/**
 * YouTube Data API v3 client for fetching video metadata
 * Docs: https://developers.google.com/youtube/v3/docs
 */

export interface Video {
  id: string;
  title: string;
  url: string;
  upload_date: string; // Format: YYYYMMDD
}

interface YouTubeVideoSnippet {
  publishedAt: string;
  title: string;
  resourceId: {
    videoId: string;
  };
}

interface YouTubePlaylistItem {
  snippet: YouTubeVideoSnippet;
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
}

interface YouTubeChannel {
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
}

interface YouTubeChannelResponse {
  items: YouTubeChannel[];
}

/**
 * Extract channel ID or username from YouTube URL
 */
function extractChannelIdentifier(url: string): {
  type: 'id' | 'username';
  value: string;
} {
  // Handle @username URLs
  const usernameMatch = url.match(/@([\w-]+)/);
  if (usernameMatch?.[1]) {
    return { type: 'username', value: usernameMatch[1] };
  }

  // Handle /channel/ID URLs
  const channelMatch = url.match(/\/channel\/([\w-]+)/);
  if (channelMatch?.[1]) {
    return { type: 'id', value: channelMatch[1] };
  }

  // Handle custom URLs like /c/name
  const customMatch = url.match(/\/c\/([\w-]+)/);
  if (customMatch?.[1]) {
    return { type: 'username', value: customMatch[1] };
  }

  throw new Error(`Could not extract channel identifier from URL: ${url}`);
}

/**
 * Get the uploads playlist ID for a channel
 */
async function getUploadsPlaylistId(apiKey: string, channelUrl: string): Promise<string> {
  const identifier = extractChannelIdentifier(channelUrl);

  const params = new URLSearchParams({
    part: 'contentDetails',
    key: apiKey,
  });

  if (identifier.type === 'id') {
    params.append('id', identifier.value);
  } else {
    params.append('forHandle', identifier.value);
  }

  const url = `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as YouTubeChannelResponse;

  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }

  return data.items[0]!.contentDetails.relatedPlaylists.uploads;
}

/**
 * Fetch videos from a playlist with pagination
 */
async function fetchPlaylistVideos(
  apiKey: string,
  playlistId: string,
  maxResults = 100,
): Promise<Video[]> {
  const videos: Video[] = [];
  let pageToken: string | undefined;
  let remainingResults = maxResults;

  while (remainingResults > 0) {
    const perPage = Math.min(remainingResults, 50); // API max is 50 per page
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: perPage.toString(),
      key: apiKey,
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as YouTubePlaylistResponse;

    for (const item of data.items) {
      const snippet = item.snippet;
      const publishDate = new Date(snippet.publishedAt);

      videos.push({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        url: `https://youtube.com/watch?v=${snippet.resourceId.videoId}`,
        upload_date: formatDateYYYYMMDD(publishDate),
      });
    }

    remainingResults -= data.items.length;
    pageToken = data.nextPageToken;

    // Break if no more pages
    if (!pageToken) break;
  }

  return videos;
}

/**
 * Format Date object to YYYYMMDD string
 */
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Fetch recent videos from a YouTube channel using the YouTube Data API
 * @param apiKey YouTube Data API v3 key
 * @param channelUrl Full YouTube channel URL
 * @param maxResults Maximum number of videos to fetch (default: 100)
 * @returns Array of videos with metadata
 */
export async function fetchChannelVideos(
  apiKey: string,
  channelUrl: string,
  maxResults = 100,
): Promise<Video[]> {
  try {
    // Get the uploads playlist ID for this channel
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelUrl);

    // Fetch videos from the uploads playlist
    const videos = await fetchPlaylistVideos(apiKey, uploadsPlaylistId, maxResults);

    return videos;
  } catch (error) {
    throw new Error(`Failed to fetch videos via API: ${(error as Error).message}`);
  }
}
