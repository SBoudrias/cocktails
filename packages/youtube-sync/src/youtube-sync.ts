#!/usr/bin/env -S node --no-warnings

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { RECIPE_ROOT, YOUTUBE_CHANNEL_ROOT } from '@cocktails/data/constants';
import { Command } from 'commander';
import { logger } from './cli-util.ts';
import * as YouTubeAPI from './youtube-api.ts';

const DEFAULT_MAX_AGE_DAYS = 7;
const ISSUE_LABELS = ['youtube', 'automation'];

interface ChannelSource {
  slug: string;
  name: string;
  links: string[];
}

interface Video {
  id: string;
  title: string;
  url: string;
  upload_date: string;
  duration?: number; // Duration in seconds
}

interface NewVideosForChannel {
  channelSlug: string;
  channelName: string;
  channelUrls: string[];
  videos: Video[];
}

interface RecipeWithRefs {
  refs?: Array<{ type: string; videoId?: string }>;
}

interface YtDlpOutput {
  entries?: Array<{
    id: string;
    title: string;
    url?: string;
    upload_date: string;
    duration?: number;
  }>;
}

// Parse CLI arguments with commander
const program = new Command();

program
  .name('youtube-sync')
  .description('Sync YouTube channels and create GitHub issues for new videos')
  .option('--dry-run', 'Test without creating GitHub issues')
  .option(
    '--days <number>',
    'Number of days to look back for videos',
    DEFAULT_MAX_AGE_DAYS.toString(),
  )
  .option('--channel <slug>', 'Only process a specific channel by slug')
  .parse();

const options = program.opts();
const dryRun = options.dryRun ?? false;
const maxAgeDays = Number.parseInt(options.days);
const specificChannel = options.channel ?? null;

/**
 * Get all tracked YouTube channels from the filesystem
 */
async function getTrackedChannels(): Promise<ChannelSource[]> {
  const channels: ChannelSource[] = [];
  const entries = await fs.readdir(YOUTUBE_CHANNEL_ROOT);

  for (const entry of entries) {
    const sourcePath = path.join(YOUTUBE_CHANNEL_ROOT, entry, '_source.json');
    try {
      const sourceData = JSON.parse(await fs.readFile(sourcePath, 'utf-8'));
      channels.push({
        slug: entry,
        name: sourceData.name,
        links: sourceData.links,
      });
    } catch {
      // Skip directories without _source.json
      continue;
    }
  }

  return channels;
}

/**
 * Fetch recent videos from a YouTube channel using yt-dlp (fallback method)
 * Fetches the most recent N videos (default: 100) which includes upload dates
 * This is faster than fetching all videos or using date filtering
 */
function fetchChannelVideosYtDlp(channelUrl: string, playlistEnd = 100): Video[] {
  // Ensure URL ends with /videos to get all channel videos
  const videosUrl = channelUrl.endsWith('/videos') ? channelUrl : `${channelUrl}/videos`;

  try {
    // Note: yt-dlp may return non-zero exit code even with --ignore-errors if some videos fail
    // Use || true to force exit code 0 so execSync doesn't throw
    const output = execSync(
      `yt-dlp --ignore-errors --no-warnings --playlist-end ${playlistEnd} --skip-download --dump-single-json "${videosUrl}" || true`,
      { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 },
    );

    if (!output || output.trim() === '') {
      throw new Error('yt-dlp returned empty output');
    }

    const data = JSON.parse(output) as YtDlpOutput;

    return (data.entries ?? [])
      .filter((entry) => entry != null) // Filter out null entries from failed videos
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url || `https://youtube.com/watch?v=${entry.id}`,
        upload_date: entry.upload_date,
        duration: entry.duration,
      }));
  } catch (error) {
    throw new Error(`Failed to fetch videos: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

/**
 * Fetch recent videos from a YouTube channel
 * Tries YouTube Data API first (if key available), falls back to yt-dlp
 */
async function fetchChannelVideos(
  channelUrl: string,
  maxResults = 100,
): Promise<Video[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Try YouTube Data API first if key is available
  if (apiKey) {
    try {
      logger.item('Using YouTube Data API...');
      const videos = await YouTubeAPI.fetchChannelVideos(apiKey, channelUrl, maxResults);
      return videos;
    } catch (error) {
      logger.error(`API failed: ${(error as Error).message}`);
      logger.item('Falling back to yt-dlp...');
    }
  } else {
    logger.item('No YOUTUBE_API_KEY found, using yt-dlp...');
  }

  // Fall back to yt-dlp
  return fetchChannelVideosYtDlp(channelUrl, maxResults);
}

/**
 * Get all existing video IDs by scanning the entire recipes directory tree.
 * This catches videos referenced under any channel or book source.
 */
async function getAllExistingVideoIds(): Promise<Set<string>> {
  const videoIds = new Set<string>();

  async function scanDirectory(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.json') && entry.name !== '_source.json') {
        try {
          const recipe = JSON.parse(
            await fs.readFile(fullPath, 'utf-8'),
          ) as RecipeWithRefs;
          for (const ref of recipe.refs ?? []) {
            if (ref.type === 'youtube' && ref.videoId) {
              videoIds.add(ref.videoId);
            }
          }
        } catch {
          // Skip files that can't be parsed
        }
      }
    }
  }

  await scanDirectory(RECIPE_ROOT);
  return videoIds;
}

/**
 * Filter videos to find new ones that don't have recipes yet
 * and were uploaded within the specified timeframe.
 * Also filters out YouTube Shorts (videos ≤ 60 seconds).
 */
function findNewVideos(
  allVideos: Video[],
  existingIds: Set<string>,
  maxAgeDays: number,
): Video[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  return allVideos
    .filter((video) => {
      // Exclude videos that already have recipes
      if (existingIds.has(video.id)) return false;

      // Filter out YouTube Shorts (≤ 60 seconds)
      if (video.duration != null && video.duration <= 60) return false;

      // Skip videos without upload date
      if (!video.upload_date) return false;

      // Parse upload_date (format: YYYYMMDD)
      const year = Number.parseInt(video.upload_date.slice(0, 4));
      const month = Number.parseInt(video.upload_date.slice(4, 6)) - 1;
      const day = Number.parseInt(video.upload_date.slice(6, 8));
      const uploadDate = new Date(year, month, day);

      // Only include videos uploaded after cutoff
      return uploadDate >= cutoffDate;
    })
    .toSorted((a, b) => b.upload_date.localeCompare(a.upload_date)); // Newest first
}

/**
 * Format the issue body as an actionable AI agent prompt
 */
function formatIssueBody(newVideos: NewVideosForChannel[]): string {
  const lines = [
    'Process the new YouTube videos listed below. For each video:',
    '',
    '1. Use the `youtube` skill to fetch the video metadata.',
    '2. Skip non-recipe content (vlogs, Q&As, gear reviews, rankings, etc.)',
    '3. Check if a recipe with that name already exists in the codebase.',
    '   - If the existing recipe uses very similar proportions and ingredients, add the video to its `refs` array.',
    '   - If the recipe differs significantly (different proportions or ingredients), create a new recipe with a unique slug.',
    '4. For new cocktail recipes, use the `create-recipes` skill to create the recipe file.',
    '',
  ];

  for (const channel of newVideos) {
    const channelLinks = channel.channelUrls.map((url) => `[link](${url})`).join(', ');
    lines.push(`## ${channel.channelName} (${channelLinks})`, '');

    for (const video of channel.videos) {
      lines.push(`- [${video.title}](${video.url})`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get the Monday of the current week for the issue title
 */
function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Create a GitHub issue with the new videos list
 */
function createGitHubIssue(newVideos: NewVideosForChannel[]): void {
  const weekStart = getWeekStartDate();
  const title = `New YouTube Videos (Week of ${weekStart})`;
  const body = formatIssueBody(newVideos);

  // Ensure labels exist (--force creates if missing or updates if exists)
  for (const label of ISSUE_LABELS) {
    try {
      execSync(`gh label create "${label}" --force`, { stdio: 'ignore' });
    } catch {
      // Ignore errors - we'll try to use the label anyway
    }
  }

  const labelArgs = ISSUE_LABELS.map((label) => `--label "${label}"`).join(' ');

  try {
    // Use stdin to pass body to avoid shell escaping issues with backticks
    execSync(`gh issue create --title "${title}" --body-file - ${labelArgs}`, {
      input: body,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf-8',
    });
    logger.success('GitHub issue created successfully');
  } catch (error) {
    throw new Error(`Failed to create GitHub issue: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  logger.header('📺 YouTube Video Sync');
  logger.item(`Max age: ${maxAgeDays} days`);
  logger.item(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  if (specificChannel) {
    logger.item(`Channel filter: ${specificChannel}`);
  }
  logger.footer();

  // Get tracked channels
  logger.header('📋 Loading tracked channels...');
  let channels = await getTrackedChannels();

  // Filter to specific channel if requested
  if (specificChannel) {
    channels = channels.filter((ch) => ch.slug === specificChannel);
    if (channels.length === 0) {
      console.error(`❌ Channel "${specificChannel}" not found`);
      process.exit(1);
    }
  }

  logger.item(`Found ${channels.length} channel(s)`);
  logger.footer();

  // Build global set of existing video IDs across all recipe sources
  logger.header('📚 Scanning existing recipes for video IDs...');
  const existingIds = await getAllExistingVideoIds();
  logger.item(`Found ${existingIds.size} existing video references`);
  logger.footer();

  // Process each channel
  const allNewVideos: NewVideosForChannel[] = [];

  for (const channel of channels) {
    logger.header(`🔍 Processing: ${channel.name}`);

    try {
      // Fetch recent videos from all channel links and merge
      const allVideos: Video[] = [];
      for (const link of channel.links) {
        logger.item(`Fetching recent videos from ${link}...`);
        const videos = await fetchChannelVideos(link);
        allVideos.push(...videos);
      }

      // Deduplicate by video ID (in case same video appears via multiple channel links)
      const seen = new Set<string>();
      const uniqueVideos = allVideos.filter((video) => {
        if (seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
      });

      logger.item(`Found ${uniqueVideos.length} recent videos`);

      // Find new videos from the specified timeframe
      const newVideos = findNewVideos(uniqueVideos, existingIds, maxAgeDays);
      logger.item(`Found ${newVideos.length} new video(s) from last ${maxAgeDays} days`);

      if (newVideos.length > 0) {
        allNewVideos.push({
          channelSlug: channel.slug,
          channelName: channel.name,
          channelUrls: channel.links,
          videos: newVideos,
        });
      }

      logger.footer('Done');
    } catch (error) {
      logger.error(`Error: ${(error as Error).message}`);
      logger.footer('Skipping channel');
      continue;
    }
  }

  // Create issue or print results
  logger.header('📊 Summary');
  const totalNewVideos = allNewVideos.reduce((sum, ch) => sum + ch.videos.length, 0);
  logger.item(`Channels with new videos: ${allNewVideos.length}`);
  logger.item(`Total new videos: ${totalNewVideos}`);
  logger.footer();

  if (totalNewVideos === 0) {
    logger.success('No new videos found - nothing to do!');
    return;
  }

  if (dryRun) {
    logger.header('📝 Dry run - Issue preview:');
    logger.item('─────────────────────────────');
    console.log(formatIssueBody(allNewVideos));
    logger.footer('─────────────────────────────');
  } else {
    logger.header('📤 Creating GitHub issue...');
    createGitHubIssue(allNewVideos);
    logger.footer();
  }

  logger.success('YouTube sync completed successfully!');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
