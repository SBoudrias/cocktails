#!/usr/bin/env -S node --no-warnings

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const YOUTUBE_CHANNEL_ROOT = path.join(ROOT, 'src/data/recipes/youtube-channel');
const DEFAULT_MAX_AGE_DAYS = 7;
const ISSUE_LABELS = ['youtube', 'automation'];

interface ChannelSource {
  slug: string;
  name: string;
  link: string;
}

interface Video {
  id: string;
  title: string;
  url: string;
  upload_date: string;
}

interface NewVideosForChannel {
  channelSlug: string;
  channelName: string;
  channelUrl: string;
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
  }>;
}

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const daysIndex = args.indexOf('--days');
const daysArg = daysIndex !== -1 ? args[daysIndex + 1] : undefined;
const maxAgeDays = daysArg ? Number.parseInt(daysArg) : DEFAULT_MAX_AGE_DAYS;

const channelIndex = args.indexOf('--channel');
const specificChannel = channelIndex !== -1 ? (args[channelIndex + 1] ?? null) : null;

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
        link: sourceData.link,
      });
    } catch {
      // Skip directories without _source.json
      continue;
    }
  }

  return channels;
}

/**
 * Fetch all videos from a YouTube channel using yt-dlp
 */
function fetchChannelVideos(channelUrl: string): Video[] {
  try {
    const output = execSync(
      `yt-dlp --flat-playlist --skip-download --dump-single-json "${channelUrl}"`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    const data = JSON.parse(output) as YtDlpOutput;
    return (data.entries ?? []).map((entry) => ({
      id: entry.id,
      title: entry.title,
      url: entry.url || `https://youtube.com/watch?v=${entry.id}`,
      upload_date: entry.upload_date,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch videos: ${(error as Error).message}`);
  }
}

/**
 * Get all existing video IDs for a channel by scanning recipe files
 */
async function getExistingVideoIds(channelSlug: string): Promise<Set<string>> {
  const videoIds = new Set<string>();
  const channelPath = path.join(YOUTUBE_CHANNEL_ROOT, channelSlug);

  try {
    const files = await fs.readdir(channelPath);

    for (const file of files) {
      if (file === '_source.json' || !file.endsWith('.json')) continue;

      const recipePath = path.join(channelPath, file);
      const recipe = JSON.parse(await fs.readFile(recipePath, 'utf-8')) as RecipeWithRefs;

      for (const ref of recipe.refs ?? []) {
        if (ref.type === 'youtube' && ref.videoId) {
          videoIds.add(ref.videoId);
        }
      }
    }
  } catch {
    // Channel directory doesn't exist or is empty
  }

  return videoIds;
}

/**
 * Filter videos to find new ones uploaded within the specified timeframe
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
 * Format the issue body in Markdown
 */
function formatIssueBody(newVideos: NewVideosForChannel[]): string {
  const lines = [
    '## New Videos from Tracked Channels',
    '',
    "This issue tracks new videos from our YouTube channels that don't have recipes yet.",
    '',
  ];

  for (const channel of newVideos) {
    const videoCount = channel.videos.length;
    const videoLabel = videoCount === 1 ? 'video' : 'videos';
    lines.push(
      `### [${channel.channelName}](${channel.channelUrl}) - ${videoCount} new ${videoLabel}`,
      '',
    );

    for (const video of channel.videos) {
      // Format date as YYYY-MM-DD
      const year = video.upload_date.slice(0, 4);
      const month = video.upload_date.slice(4, 6);
      const day = video.upload_date.slice(6, 8);
      const formattedDate = `${year}-${month}-${day}`;

      lines.push(
        `- **[${video.title}](${video.url})** (${formattedDate}) - \`videoId: ${video.id}\``,
      );
    }

    lines.push('');
  }

  lines.push('---', 'Generated automatically by youtube-sync workflow');

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

  const labelArgs = ISSUE_LABELS.map((label) => `--label "${label}"`).join(' ');

  try {
    execSync(`gh issue create --title "${title}" --body "${body}" ${labelArgs}`, {
      stdio: 'inherit',
    });
    console.log('✅ GitHub issue created successfully');
  } catch (error) {
    throw new Error(`Failed to create GitHub issue: ${(error as Error).message}`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('╭ 📺 YouTube Video Sync');
  console.log(`├ Max age: ${maxAgeDays} days`);
  console.log(`├ Dry run: ${dryRun ? 'yes' : 'no'}`);
  if (specificChannel) {
    console.log(`├ Channel filter: ${specificChannel}`);
  }
  console.log('╰');

  // Get tracked channels
  console.log('\n╭ 📋 Loading tracked channels...');
  let channels = await getTrackedChannels();

  // Filter to specific channel if requested
  if (specificChannel) {
    channels = channels.filter((ch) => ch.slug === specificChannel);
    if (channels.length === 0) {
      console.error(`❌ Channel "${specificChannel}" not found`);
      process.exit(1);
    }
  }

  console.log(`├ Found ${channels.length} channel(s)`);
  console.log('╰');

  // Process each channel
  const allNewVideos: NewVideosForChannel[] = [];

  for (const channel of channels) {
    console.log(`\n╭ 🔍 Processing: ${channel.name}`);

    try {
      // Fetch videos from YouTube
      console.log('├ Fetching videos from YouTube...');
      const allVideos = fetchChannelVideos(channel.link);
      console.log(`├ Found ${allVideos.length} total videos`);

      // Get existing video IDs
      console.log('├ Reading existing recipes...');
      const existingIds = await getExistingVideoIds(channel.slug);
      console.log(`├ Found ${existingIds.size} existing recipes`);

      // Find new videos
      const newVideos = findNewVideos(allVideos, existingIds, maxAgeDays);
      console.log(`├ Found ${newVideos.length} new video(s)`);

      if (newVideos.length > 0) {
        allNewVideos.push({
          channelSlug: channel.slug,
          channelName: channel.name,
          channelUrl: channel.link,
          videos: newVideos,
        });
      }

      console.log('╰ Done');
    } catch (error) {
      console.error(`├ ❌ Error: ${(error as Error).message}`);
      console.log('╰ Skipping channel');
      continue;
    }
  }

  // Create issue or print results
  console.log('\n╭ 📊 Summary');
  const totalNewVideos = allNewVideos.reduce((sum, ch) => sum + ch.videos.length, 0);
  console.log(`├ Channels with new videos: ${allNewVideos.length}`);
  console.log(`├ Total new videos: ${totalNewVideos}`);
  console.log('╰');

  if (totalNewVideos === 0) {
    console.log('\n✅ No new videos found - nothing to do!');
    return;
  }

  if (dryRun) {
    console.log('\n╭ 📝 Dry run - Issue preview:');
    console.log('├─────────────────────────────');
    console.log(formatIssueBody(allNewVideos));
    console.log('╰─────────────────────────────');
  } else {
    console.log('\n╭ 📤 Creating GitHub issue...');
    createGitHubIssue(allNewVideos);
    console.log('╰');
  }

  console.log('\n✅ YouTube sync completed successfully!');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
