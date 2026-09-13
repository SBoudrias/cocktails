/**
 * Backfill `refs[].channel` on youtube references in data files.
 *
 * Youtube refs require a `channel` field holding the slug of the
 * `youtube-channel` source that published the video. This script resolves
 * every existing ref videoId to its channel and stamps the field.
 *
 * Resolution strategy:
 * 1. Flat-enumerate every tracked channel's uploads playlist (one yt-dlp call
 *    per link) to map most videoIds to slugs.
 * 2. Resolve the remaining videoIds one by one via full extraction, mapping
 *    their channel_id back to a tracked channel slug.
 * 3. Videos from channels that are not tracked sources get their slugified
 *    channel name stamped instead — they stay unlisted, but the data records
 *    provenance. check-data warns about such channels.
 * 4. Cache every network resolution so reruns are cheap.
 *
 * Run `yarn check-data` after this script: it validates the stamped channels
 * and normalizes key ordering in the edited files.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_ROOT } from '@cocktails/data/constants';
import slugify from '@sindresorhus/slugify';
import { Command } from 'commander';
import { logger } from './cli-util.ts';
import { getTrackedChannels, type ChannelSource } from './youtube-channel-videos.ts';

const DEFAULT_CACHE_PATH = 'tmp/youtube-ref-channels-cache.json';

type RawRef = Record<string, unknown> & { type: string };

type YoutubeRef = RawRef & { videoId: string; channel?: unknown };

function isYoutubeRef(ref: RawRef): ref is YoutubeRef {
  return ref.type === 'youtube' && typeof ref.videoId === 'string';
}

function isRawRef(value: unknown): value is RawRef {
  return isRecord(value) && typeof value.type === 'string';
}

type DataFile = {
  filepath: string;
  data: Record<string, unknown>;
  refs: RawRef[];
};

type Cache = {
  /** videoId -> tracked channel slug */
  videos: Record<string, string>;
  /** youtube channel_id -> tracked channel slug */
  channels: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getChannelVideosUrl(channelUrl: string): string {
  return channelUrl.endsWith('/videos') ? channelUrl : `${channelUrl}/videos`;
}

function runYtDlp(args: string[]): string {
  const result = spawnSync('yt-dlp', [...args, '--no-warnings', '--'], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to run yt-dlp: ${result.error.message}`);
  }

  return result.stdout.trim();
}

/** Resolve the youtube channel_id behind a channel page URL (one full extraction). */
function resolveChannelId(channelUrl: string): string | undefined {
  const output = runYtDlp([
    '--skip-download',
    '--playlist-items',
    '1',
    '--print',
    'channel_id',
    getChannelVideosUrl(channelUrl),
  ]);
  const [channelId] = output.split('\n');

  return channelId && channelId !== 'NA' ? channelId : undefined;
}

/**
 * Resolve which channel a single video belongs to.
 * Returns the channel id and display name, or undefined when the video is
 * unavailable (deleted, private, ...).
 */
function resolveVideoChannel(
  videoId: string,
): { channelId: string; name: string } | undefined {
  const output = runYtDlp([
    '--skip-download',
    '--no-playlist',
    '--print',
    '%(channel)s',
    '--print',
    'channel_id',
    `https://youtube.com/watch?v=${videoId}`,
  ]);
  const [name, channelId] = output.split('\n');

  if (!name || !channelId || channelId === 'NA') return undefined;

  return { channelId, name };
}

async function loadCache(cachePath: string): Promise<Cache> {
  try {
    const cache = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
    if (isRecord(cache) && isRecord(cache.videos) && isRecord(cache.channels)) {
      return cache as unknown as Cache;
    }
  } catch {
    // No usable cache yet — start fresh.
  }

  return { videos: {}, channels: {} };
}

async function saveCache(cachePath: string, cache: Cache): Promise<void> {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

async function collectDataFiles(): Promise<DataFile[]> {
  const files: DataFile[] = [];

  async function scanDirectory(dirPath: string): Promise<void> {
    for (const entry of await fs.readdir(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.json')) continue;

      const data: unknown = JSON.parse(await fs.readFile(entryPath, 'utf-8'));
      if (!isRecord(data) || !Array.isArray(data.refs)) continue;

      files.push({
        filepath: entryPath,
        data,
        refs: data.refs.flatMap((ref): RawRef[] => (isRawRef(ref) ? [ref] : [])),
      });
    }
  }

  await scanDirectory(DATA_ROOT);

  return files;
}

/**
 * Map videoIds to tracked channel slugs via each link's flat uploads
 * playlist. Videos absent from these playlists (deleted, unlisted,
 * members-only) are resolved one by one later.
 */
async function mapVideosFromChannelPlaylists(
  channels: ChannelSource[],
  cache: Cache,
): Promise<void> {
  for (const channel of channels) {
    // A source may cover several youtube channels (e.g. Spike's Breezeway
    // Cocktail Hour links both @BreezewayCocktailHour and @TikiCocktails).
    for (const link of channel.links) {
      logger.item(`Enumerating ${channel.name} — ${link}...`);

      // Register the link's channel_id (needed to map per-video resolutions
      // back to a slug).
      const channelId = resolveChannelId(link);
      if (channelId) {
        cache.channels[channelId] ??= channel.slug;
      }

      const output = runYtDlp([
        '--ignore-errors',
        '--flat-playlist',
        '--print',
        'id',
        getChannelVideosUrl(link),
      ]);

      for (const videoId of output.split('\n')) {
        const id = videoId.trim();
        if (id && id !== 'NA' && !cache.videos[id]) {
          cache.videos[id] = channel.slug;
        }
      }
    }
  }
}

async function resolveUnknownVideos(
  unknownVideoIds: string[],
  cache: Cache,
): Promise<void> {
  for (const [index, videoId] of unknownVideoIds.entries()) {
    if ((index + 1) % 10 === 0) {
      logger.item(`Resolving ${index + 1}/${unknownVideoIds.length} unknown videos...`);
    }

    const channel = resolveVideoChannel(videoId);
    if (!channel) continue;

    const trackedSlug = cache.channels[channel.channelId];
    if (trackedSlug) {
      cache.videos[videoId] = trackedSlug;
      continue;
    }

    // Untracked channels keep their slugified name as the channel value. They
    // stay unlisted (no source folder), but the data records provenance.
    const nameSlug = slugify(channel.name);
    logger.change(
      `Video ${videoId} belongs to untracked channel "${channel.name}" — stamping "${nameSlug}"`,
    );
    cache.videos[videoId] = nameSlug;
  }
}

async function main(): Promise<void> {
  const program = new Command()
    .name('youtube-ref-channels')
    .description('Backfill refs[].channel on youtube references in data files')
    .option('--cache <path>', 'Resolution cache file', DEFAULT_CACHE_PATH)
    .option('--dry-run', 'Report what would change without writing files')
    .parse();

  const options = program.opts<{ cache: string; dryRun?: boolean }>();
  const cache = await loadCache(options.cache);

  logger.header('📚 Collecting data files with youtube refs...');
  const files = await collectDataFiles();
  const youtubeRefs = files.flatMap((file) =>
    file.refs.flatMap((ref) => (isYoutubeRef(ref) ? [ref] : [])),
  );
  const missing = youtubeRefs.filter((ref) => typeof ref.channel !== 'string');
  logger.item(
    `${youtubeRefs.length} youtube refs in ${files.length} files, ${missing.length} missing channel`,
  );
  logger.footer('Done!');

  if (missing.length === 0) {
    logger.success('All youtube refs already have a channel!');
    return;
  }

  logger.header('📺 Resolving video channels...');
  const channels = await getTrackedChannels();
  await mapVideosFromChannelPlaylists(channels, cache);

  const unknownVideoIds = [...new Set(missing.map((ref) => ref.videoId))].filter(
    (videoId) => !cache.videos[videoId],
  );
  if (unknownVideoIds.length > 0) {
    logger.item(
      `${unknownVideoIds.length} videos not in channel playlists, resolving...`,
    );
    await resolveUnknownVideos(unknownVideoIds, cache);
  }
  logger.footer('Done!');

  if (!options.dryRun) {
    await saveCache(options.cache, cache);
  }

  logger.header('✍️ Stamping channels...');
  const unresolved = new Map<string, string>();
  let stampedRefs = 0;
  let stampedFiles = 0;

  for (const file of files) {
    let changed = false;

    file.data.refs = file.refs.map((ref) => {
      if (!isYoutubeRef(ref) || typeof ref.channel === 'string') return ref;

      const channel = cache.videos[ref.videoId];
      if (!channel) {
        unresolved.set(ref.videoId, path.relative(process.cwd(), file.filepath));
        return ref;
      }

      changed = true;
      stampedRefs++;

      return { ...ref, channel };
    });

    if (!changed) continue;
    stampedFiles++;

    if (!options.dryRun) {
      await fs.writeFile(file.filepath, `${JSON.stringify(file.data, null, 2)}\n`);
    }
  }

  logger.item(
    `${options.dryRun ? 'Would stamp' : 'Stamped'} ${stampedRefs} refs in ${stampedFiles} files`,
  );
  logger.footer('Done!');

  if (unresolved.size > 0) {
    logger.failure(`⚠️ ${unresolved.size} videos could not be resolved to a channel:`);
    for (const [videoId, recipePath] of unresolved) {
      logger.error(`${recipePath}: ${videoId}`);
    }
    logger.error(`Fix these refs manually (or remove them), then rerun.`);
    process.exit(1);
  }

  logger.success('All youtube refs have a channel!');
  logger.item('Run `yarn check-data` to validate and normalize the edited files.');
}

await main();
