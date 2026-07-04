import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { YOUTUBE_CHANNEL_ROOT } from '@cocktails/data/constants';
import * as YouTubeAPI from './youtube-api.ts';

export type Video = YouTubeAPI.Video;

export type FlatPlaylistVideo = Omit<Video, 'upload_date'> & {
  upload_date?: string;
};

export interface ChannelSource {
  slug: string;
  name: string;
  links: string[];
}

type FetchChannelVideosOptions = {
  maxResults?: number;
  onStatus?: (message: string) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

function readNumber(value: Record<string, unknown>, key: string): number | undefined {
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeMaxResults(maxResults: number | undefined): number {
  return maxResults ?? 100;
}

/**
 * Get all tracked YouTube channels from the filesystem.
 */
export async function getTrackedChannels(): Promise<ChannelSource[]> {
  const channels: ChannelSource[] = [];
  const entries = await fs.readdir(YOUTUBE_CHANNEL_ROOT);

  for (const entry of entries) {
    const sourcePath = path.join(YOUTUBE_CHANNEL_ROOT, entry, '_source.json');

    try {
      const sourceData: unknown = JSON.parse(await fs.readFile(sourcePath, 'utf-8'));
      if (!isRecord(sourceData)) continue;

      const name = readString(sourceData, 'name');
      const links = sourceData.links;
      if (
        !name ||
        !Array.isArray(links) ||
        !links.every((link) => typeof link === 'string')
      ) {
        continue;
      }

      channels.push({ slug: entry, name, links });
    } catch {
      // Skip directories without a readable _source.json.
    }
  }

  return channels.toSorted((a, b) => a.name.localeCompare(b.name));
}

function getChannelVideosUrl(channelUrl: string): string {
  return channelUrl.endsWith('/videos') ? channelUrl : `${channelUrl}/videos`;
}

function parsePlaylistEntries<TVideo>(
  stdout: string,
  toVideo: (entry: Record<string, unknown>) => TVideo | undefined,
): TVideo[] {
  const data: unknown = JSON.parse(stdout);
  if (!isRecord(data) || !Array.isArray(data.entries)) {
    return [];
  }

  return data.entries.flatMap((entry): TVideo[] => {
    if (!isRecord(entry)) return [];

    const video = toVideo(entry);
    return video ? [video] : [];
  });
}

function runYtDlpPlaylist(channelUrl: string, args: string[]): string {
  const result = spawnSync('yt-dlp', [...args, getChannelVideosUrl(channelUrl)], {
    encoding: 'utf-8',
    maxBuffer: 100 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to run yt-dlp: ${result.error.message}`, {
      cause: result.error,
    });
  }

  if (!result.stdout.trim()) {
    const stderr = result.stderr.trim();
    throw new Error(
      stderr ? `yt-dlp returned no output: ${stderr}` : 'yt-dlp returned no output',
    );
  }

  return result.stdout;
}

function appendPlaylistLimit(args: string[], maxResults: number): string[] {
  if (!Number.isFinite(maxResults)) return args;

  return [...args, '--playlist-end', maxResults.toString()];
}

/**
 * Fetch a channel playlist with yt-dlp's flat extractor.
 *
 * This is intentionally lower fidelity than the full extractor: historical
 * inventory generation only needs stable video IDs and titles for ref matching,
 * and full extraction can hang on large channel archives.
 */
export function fetchChannelVideosFlatYtDlp(
  channelUrl: string,
  maxResults = 100,
): FlatPlaylistVideo[] {
  const args = appendPlaylistLimit(
    ['--ignore-errors', '--no-warnings', '--flat-playlist', '--dump-single-json'],
    maxResults,
  );
  const stdout = runYtDlpPlaylist(channelUrl, args);

  return parsePlaylistEntries(stdout, (entry): FlatPlaylistVideo | undefined => {
    const id = readString(entry, 'id');
    const title = readString(entry, 'title');
    if (!id || !title) return undefined;

    return {
      id,
      title,
      url: readString(entry, 'url') ?? `https://youtube.com/watch?v=${id}`,
      upload_date: readString(entry, 'upload_date'),
      duration: readNumber(entry, 'duration'),
    };
  });
}

/**
 * Fetch recent videos from a YouTube channel using yt-dlp's full extractor.
 */
export function fetchChannelVideosYtDlp(channelUrl: string, maxResults = 100): Video[] {
  const args = appendPlaylistLimit(
    ['--ignore-errors', '--no-warnings', '--skip-download', '--dump-single-json'],
    maxResults,
  );
  const stdout = runYtDlpPlaylist(channelUrl, args);

  return parsePlaylistEntries(stdout, (entry): Video | undefined => {
    const id = readString(entry, 'id');
    const title = readString(entry, 'title');
    const uploadDate = readString(entry, 'upload_date');
    if (!id || !title || !uploadDate) return undefined;

    return {
      id,
      title,
      url: readString(entry, 'url') ?? `https://youtube.com/watch?v=${id}`,
      upload_date: uploadDate,
      duration: readNumber(entry, 'duration'),
    };
  });
}

/**
 * Fetch videos from a YouTube channel.
 *
 * Tries YouTube Data API first when YOUTUBE_API_KEY is set, then falls back to yt-dlp.
 */
export async function fetchChannelVideos(
  channelUrl: string,
  options: FetchChannelVideosOptions = {},
): Promise<Video[]> {
  const maxResults = normalizeMaxResults(options.maxResults);
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      options.onStatus?.('Using YouTube Data API...');
      return await YouTubeAPI.fetchChannelVideos(apiKey, channelUrl, maxResults);
    } catch (error) {
      options.onStatus?.(`API failed: ${getErrorMessage(error)}`);
      options.onStatus?.('Falling back to yt-dlp...');
    }
  } else {
    options.onStatus?.('No YOUTUBE_API_KEY found, using yt-dlp...');
  }

  return fetchChannelVideosYtDlp(channelUrl, maxResults);
}

export function dedupeVideos<TVideo extends { id: string }>(videos: TVideo[]): TVideo[] {
  const seen = new Set<string>();

  return videos.filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}
