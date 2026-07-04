#!/usr/bin/env -S node --no-warnings

import fs from 'node:fs/promises';
import path from 'node:path';
import { RECIPE_ROOT } from '@cocktails/data/constants';
import { Command } from 'commander';
import { logger } from './cli-util.ts';
import { collectRecipeVideoReferences } from './recipe-video-refs.ts';
import type { RecipeVideoReference } from './recipe-video-refs.ts';
import {
  dedupeVideos,
  fetchChannelVideosFlatYtDlp,
  fetchChannelVideos,
  getTrackedChannels,
  type ChannelSource,
  type FlatPlaylistVideo,
} from './youtube-channel-videos.ts';

const DEFAULT_CHANNEL = 'make-and-drink';
const DEFAULT_BATCH_SIZE = 8;
const DEFAULT_MAX_RESULTS = 500;
const DEFAULT_OUTPUT_DIR = `tmp/youtube-inventory/${DEFAULT_CHANNEL}`;
const PROJECT_ROOT = path.resolve(RECIPE_ROOT, '../../../..');

type OutputFormat = 'markdown' | 'json' | 'both';
type SortOrder = 'newest' | 'oldest';
type FetchMode = 'flat' | 'full';

type InventoryOptions = {
  channel: string;
  maxResults: number;
  all?: boolean;
  includeShorts?: boolean;
  includeReferenced?: boolean;
  batchSize: number;
  outputDir: string;
  format: OutputFormat;
  sort: SortOrder;
  fetchMode: FetchMode;
  dryRun?: boolean;
};

type InventoryVideo = {
  videoId: string;
  title: string;
  url: string;
  uploadDate?: string;
  durationSeconds?: number;
  playlistIndex: number;
  source: FetchMode;
  alreadyReferenced: boolean;
  referencedBy: RecipeVideoReference[];
};

type InventoryBatch = {
  batchNumber: number;
  markdownPath?: string;
  jsonPath?: string;
  videos: InventoryVideo[];
};

function parsePositiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received "${value}"`);
  }

  return parsed;
}

function parseOutputFormat(value: string): OutputFormat {
  if (value === 'markdown' || value === 'json' || value === 'both') {
    return value;
  }

  throw new Error('Expected format to be one of: markdown, json, both');
}

function parseSortOrder(value: string): SortOrder {
  if (value === 'newest' || value === 'oldest') {
    return value;
  }

  throw new Error('Expected sort to be one of: newest, oldest');
}

function parseFetchMode(value: string): FetchMode {
  if (value === 'flat' || value === 'full') {
    return value;
  }

  throw new Error('Expected fetch mode to be one of: flat, full');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resolveOutputDir(outputDir: string): string {
  if (path.isAbsolute(outputDir)) return outputDir;

  return path.resolve(PROJECT_ROOT, outputDir);
}

function formatUploadDate(uploadDate: string): string {
  if (!/^\d{8}$/.test(uploadDate)) return uploadDate;

  return `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}`;
}

function sortVideos(videos: InventoryVideo[], sort: SortOrder): InventoryVideo[] {
  return videos.toSorted((a, b) => {
    const comparison =
      a.uploadDate && b.uploadDate
        ? a.uploadDate.localeCompare(b.uploadDate)
        : b.playlistIndex - a.playlistIndex;
    return sort === 'oldest' ? comparison : -comparison;
  });
}

function toInventoryVideo(
  video: FlatPlaylistVideo,
  references: Map<string, RecipeVideoReference[]>,
  playlistIndex: number,
  source: FetchMode,
): InventoryVideo {
  const referencedBy = references.get(video.id) ?? [];

  return {
    videoId: video.id,
    title: video.title,
    url: video.url,
    uploadDate: video.upload_date ? formatUploadDate(video.upload_date) : undefined,
    durationSeconds: video.duration,
    playlistIndex,
    source,
    alreadyReferenced: referencedBy.length > 0,
    referencedBy,
  };
}

function selectBatchVideos(
  videos: InventoryVideo[],
  options: InventoryOptions,
): InventoryVideo[] {
  return videos.filter((video) => {
    if (!options.includeReferenced && video.alreadyReferenced) return false;
    if (
      !options.includeShorts &&
      video.durationSeconds != null &&
      video.durationSeconds <= 60
    ) {
      return false;
    }

    return true;
  });
}

function getExcludedVideos(
  videos: InventoryVideo[],
  options: InventoryOptions,
): Array<InventoryVideo & { reason: 'already-referenced' | 'short' }> {
  return videos.flatMap(
    (video): Array<InventoryVideo & { reason: 'already-referenced' | 'short' }> => {
      if (!options.includeReferenced && video.alreadyReferenced) {
        return [{ ...video, reason: 'already-referenced' }];
      }

      if (
        !options.includeShorts &&
        video.durationSeconds != null &&
        video.durationSeconds <= 60
      ) {
        return [{ ...video, reason: 'short' }];
      }

      return [];
    },
  );
}

function chunkVideos(videos: InventoryVideo[], batchSize: number): InventoryVideo[][] {
  const chunks: InventoryVideo[][] = [];

  for (let index = 0; index < videos.length; index += batchSize) {
    chunks.push(videos.slice(index, index + batchSize));
  }

  return chunks;
}

function padBatchNumber(batchNumber: number): string {
  return String(batchNumber).padStart(3, '0');
}

function formatRecipeReferences(references: RecipeVideoReference[]): string[] {
  if (references.length === 0) return ['  - existingRefs: none'];

  return [
    '  - existingRefs:',
    ...references.map((ref) => {
      const start = ref.start == null ? '' : ` at ${ref.start}s`;
      return `    - ${ref.recipePath}${start}`;
    }),
  ];
}

function formatBatchMarkdown(channel: ChannelSource, batch: InventoryBatch): string {
  const lines = [
    `# ${channel.name} Backfill Batch ${padBatchNumber(batch.batchNumber)}`,
    '',
    `Source: youtube-channel/${channel.slug}`,
    '',
    'For each video:',
    '',
    '1. Use the `youtube` skill to fetch video metadata and recipe details.',
    '2. Split multi-recipe videos into separate recipe candidates and use `refs[].start` when useful.',
    '3. Search existing recipe files before creating a new Make and Drink recipe.',
    '4. Add a YouTube ref to an existing book or channel recipe when the formula matches.',
    '5. Create a new `youtube-channel/make-and-drink` recipe only when the video version is distinct.',
    '6. Report `create`, `add-ref`, `skip`, or `uncertain` for every video with evidence.',
    '',
    'Run `yarn check-data` after edits.',
    '',
    '## Videos',
    '',
  ];

  for (const video of batch.videos) {
    lines.push(`- [${video.title}](${video.url})`);
    lines.push(`  - videoId: ${video.videoId}`);
    lines.push(`  - source: ${video.source}`);
    lines.push(`  - playlistIndex: ${video.playlistIndex}`);
    lines.push(`  - uploadDate: ${video.uploadDate ?? 'unknown'}`);
    if (video.durationSeconds != null) {
      lines.push(`  - durationSeconds: ${video.durationSeconds}`);
    }
    lines.push(...formatRecipeReferences(video.referencedBy));
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function getBatchPaths(
  outputDir: string,
  format: OutputFormat,
  batchNumber: number,
): Pick<InventoryBatch, 'markdownPath' | 'jsonPath'> {
  const batchSlug = `batch-${padBatchNumber(batchNumber)}`;

  return {
    markdownPath:
      format === 'markdown' || format === 'both'
        ? path.join(outputDir, `${batchSlug}.md`)
        : undefined,
    jsonPath:
      format === 'json' || format === 'both'
        ? path.join(outputDir, `${batchSlug}.json`)
        : undefined,
  };
}

async function writeJson(filepath: string, data: unknown): Promise<void> {
  await fs.writeFile(filepath, `${JSON.stringify(data, null, 2)}\n`);
}

async function writeBatches(
  outputDir: string,
  channel: ChannelSource,
  batches: InventoryBatch[],
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  for (const batch of batches) {
    if (batch.markdownPath) {
      await fs.writeFile(batch.markdownPath, formatBatchMarkdown(channel, batch));
    }

    if (batch.jsonPath) {
      await writeJson(batch.jsonPath, batch);
    }
  }
}

function buildIndex(
  channel: ChannelSource,
  options: InventoryOptions,
  videos: InventoryVideo[],
  selectedVideos: InventoryVideo[],
  excludedVideos: Array<InventoryVideo & { reason: 'already-referenced' | 'short' }>,
  batches: InventoryBatch[],
): object {
  return {
    generatedAt: new Date().toISOString(),
    channel: {
      slug: channel.slug,
      name: channel.name,
      links: channel.links,
    },
    options: {
      maxResults: options.all ? 'all' : options.maxResults,
      includeShorts: Boolean(options.includeShorts),
      includeReferenced: Boolean(options.includeReferenced),
      batchSize: options.batchSize,
      sort: options.sort,
      format: options.format,
      fetchMode: options.fetchMode,
    },
    totals: {
      fetched: videos.length,
      selectedForBatches: selectedVideos.length,
      excluded: excludedVideos.length,
      alreadyReferenced: videos.filter((video) => video.alreadyReferenced).length,
      batches: batches.length,
    },
    batches: batches.map((batch) => ({
      batchNumber: batch.batchNumber,
      markdownPath: batch.markdownPath,
      jsonPath: batch.jsonPath,
      videoCount: batch.videos.length,
      videoIds: batch.videos.map((video) => video.videoId),
    })),
    excluded: excludedVideos,
  };
}

async function fetchChannelInventoryVideos(
  channel: ChannelSource,
  maxResults: number,
  fetchMode: FetchMode,
): Promise<FlatPlaylistVideo[]> {
  const videosByLink: FlatPlaylistVideo[] = [];

  for (const link of channel.links) {
    logger.item(`Fetching videos from ${link}...`);
    const videos =
      fetchMode === 'flat'
        ? fetchChannelVideosFlatYtDlp(link, maxResults)
        : await fetchChannelVideos(link, {
            maxResults,
            onStatus: (message) => logger.item(message),
          });
    videosByLink.push(...videos);
  }

  return dedupeVideos(videosByLink);
}

const program = new Command();

program
  .name('youtube-inventory')
  .description('Inventory YouTube channel videos and emit backfill batches for agents')
  .option('--channel <slug>', 'Tracked youtube-channel source slug', DEFAULT_CHANNEL)
  .option(
    '--max-results <number>',
    'Maximum number of channel videos to fetch',
    parsePositiveInteger,
    DEFAULT_MAX_RESULTS,
  )
  .option('--all', 'Fetch all available channel videos')
  .option('--include-shorts', 'Include videos with duration <= 60 seconds')
  .option('--include-referenced', 'Include videos that already appear in recipe refs')
  .option(
    '--batch-size <number>',
    'Number of videos per agent batch',
    parsePositiveInteger,
    DEFAULT_BATCH_SIZE,
  )
  .option(
    '--output-dir <path>',
    'Directory for index and batch files',
    DEFAULT_OUTPUT_DIR,
  )
  .option('--format <format>', 'markdown, json, or both', parseOutputFormat, 'both')
  .option('--sort <order>', 'oldest or newest', parseSortOrder, 'oldest')
  .option(
    '--fetch-mode <mode>',
    'flat for fast ID/title inventory, full for richer metadata',
    parseFetchMode,
    'flat',
  )
  .option('--dry-run', 'Print summary and first batch without writing files')
  .parse();

async function main(): Promise<void> {
  const options = program.opts<InventoryOptions>();
  const outputDir = resolveOutputDir(options.outputDir);
  const maxResults = options.all ? Number.POSITIVE_INFINITY : options.maxResults;

  logger.header('📺 YouTube Inventory');
  logger.item(`Channel: ${options.channel}`);
  logger.item(`Max results: ${options.all ? 'all' : options.maxResults}`);
  logger.item(`Fetch mode: ${options.fetchMode}`);
  logger.item(`Batch size: ${options.batchSize}`);
  logger.item(`Output dir: ${outputDir}`);
  logger.item(`Dry run: ${options.dryRun ? 'yes' : 'no'}`);
  logger.footer();

  logger.header('📋 Loading channel source...');
  const channel = (await getTrackedChannels()).find(
    (trackedChannel) => trackedChannel.slug === options.channel,
  );

  if (!channel) {
    throw new Error(`Channel "${options.channel}" not found`);
  }

  logger.item(`Found ${channel.name}`);
  logger.footer();

  logger.header('📚 Scanning recipe YouTube refs...');
  const recipeReferences = await collectRecipeVideoReferences();
  logger.item(`Found ${recipeReferences.size} referenced video ID(s)`);
  logger.footer();

  logger.header(`🔍 Fetching ${channel.name} videos...`);
  const fetchedVideos = await fetchChannelInventoryVideos(
    channel,
    maxResults,
    options.fetchMode,
  );
  logger.item(`Fetched ${fetchedVideos.length} unique video(s)`);
  logger.footer();

  const inventoryVideos = sortVideos(
    fetchedVideos.map((video, playlistIndex) =>
      toInventoryVideo(video, recipeReferences, playlistIndex, options.fetchMode),
    ),
    options.sort,
  );
  const selectedVideos = selectBatchVideos(inventoryVideos, options);
  const excludedVideos = getExcludedVideos(inventoryVideos, options);
  const batchVideoChunks = chunkVideos(selectedVideos, options.batchSize);
  const batches = batchVideoChunks.map((videos, index): InventoryBatch => {
    const batchNumber = index + 1;
    return {
      batchNumber,
      ...getBatchPaths(outputDir, options.format, batchNumber),
      videos,
    };
  });
  const index = buildIndex(
    channel,
    options,
    inventoryVideos,
    selectedVideos,
    excludedVideos,
    batches,
  );

  logger.header('📊 Summary');
  logger.item(`Selected for batches: ${selectedVideos.length}`);
  logger.item(`Excluded: ${excludedVideos.length}`);
  logger.item(
    `Already referenced: ${inventoryVideos.filter((video) => video.alreadyReferenced).length}`,
  );
  logger.item(`Batches: ${batches.length}`);
  logger.footer();

  if (options.dryRun) {
    console.log(JSON.stringify(index, null, 2));
    if (batches[0]) {
      console.log('\n--- First batch preview ---\n');
      console.log(formatBatchMarkdown(channel, batches[0]));
    }
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, 'index.json'), index);
  await writeBatches(outputDir, channel, batches);

  logger.success(`Inventory written to ${outputDir}`);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', getErrorMessage(error));
  process.exit(1);
});
