import { afterEach, describe, expect, it, vi } from 'vitest';
import { isUnairedBroadcast } from './live-broadcast.ts';
import { fetchChannelVideos } from './youtube-api.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isUnairedBroadcast', () => {
  it('flags live and upcoming broadcasts', () => {
    expect(isUnairedBroadcast('live')).toBe(true);
    expect(isUnairedBroadcast('upcoming')).toBe(true);
  });

  it('keeps aired videos and VOD re-uploads of past streams', () => {
    expect(isUnairedBroadcast('none')).toBe(false);
    expect(isUnairedBroadcast(undefined)).toBe(false);
  });

  it('covers the yt-dlp status spellings', () => {
    expect(isUnairedBroadcast('is_live')).toBe(true);
    expect(isUnairedBroadcast('is_upcoming')).toBe(true);
    expect(isUnairedBroadcast('was_live')).toBe(false);
    expect(isUnairedBroadcast('not_live')).toBe(false);
  });
});

describe('fetchChannelVideos', () => {
  const playlistItem = (videoId: string, title: string) => ({
    snippet: {
      publishedAt: '2025-01-10T10:00:00Z',
      title,
      resourceId: { videoId },
    },
  });

  const videoItem = (videoId: string, liveBroadcastContent: string) => ({
    id: videoId,
    contentDetails: { duration: 'PT20M31S' },
    snippet: { liveBroadcastContent },
  });

  function stubYouTubeApi(responses: unknown[]): void {
    const responsesLeft = [...responses];
    const fetchMock = vi.fn(async () => {
      const body = responsesLeft.shift();
      if (body === undefined) throw new Error('Unexpected extra fetch call');
      return {
        ok: true,
        status: 200,
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    });

    vi.stubGlobal('fetch', fetchMock);
  }

  it('drops live and upcoming broadcasts but keeps normal uploads', async () => {
    stubYouTubeApi([
      // Channel lookup: uploads playlist id.
      { items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUuploads' } } }] },
      // Uploads playlist: one video of each kind.
      {
        items: [
          playlistItem('QVSmBSfkoVI', 'Live event will begin in a few moments'),
          playlistItem('upcoming01', 'Premiere: next week stream'),
          playlistItem('normal01', 'Navy Grog | A tiki classic'),
        ],
      },
      // Batch Videos call carries snippet.liveBroadcastContent.
      {
        items: [
          videoItem('QVSmBSfkoVI', 'live'),
          videoItem('upcoming01', 'upcoming'),
          videoItem('normal01', 'none'),
        ],
      },
    ]);

    const videos = await fetchChannelVideos(
      'test-key',
      'https://youtube.com/@channel',
      50,
    );

    expect(videos).toHaveLength(1);
    expect(videos[0]?.id).toBe('normal01');
    expect(videos[0]?.title).toBe('Navy Grog | A tiki classic');
    expect(videos[0]?.duration).toBe(20 * 60 + 31);
  });

  it('keeps an upcoming stream that has since aired as a regular VOD', async () => {
    stubYouTubeApi([
      { items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUuploads' } } }] },
      { items: [playlistItem('aired01', 'Premiere: last week stream')] },
      { items: [videoItem('aired01', 'none')] },
    ]);

    const videos = await fetchChannelVideos(
      'test-key',
      'https://youtube.com/@channel',
      50,
    );

    expect(videos).toHaveLength(1);
    expect(videos[0]?.id).toBe('aired01');
  });
});
