---
name: youtube
description: Fetch video metadata from YouTube URLs using yt-dlp. Use when the user provides a YouTube URL or asks to get details from a YouTube video.
---

# YouTube Video Context

Fetch video information from YouTube using `yt-dlp`.

## Instructions

When the user provides a YouTube URL (youtube.com or youtu.be), use `yt-dlp` to fetch video metadata:

```bash
# Get full JSON metadata
yt-dlp --skip-download --dump-json "VIDEO_URL"
```

This returns JSON with:

- `title` - Video title
- `description` - Full description (often contains recipes, timestamps, links)
- `channel` - Channel name (useful for source attribution)
- `upload_date` - Publication date

## Quick commands

```bash
# Get just the description
yt-dlp --skip-download --print description "VIDEO_URL"

# Get title and description
yt-dlp --skip-download --print "%(title)s" --print description "VIDEO_URL"
```

## Examples

User: "Create a recipe from https://youtube.com/watch?v=xyz"

1. Fetch the video metadata with yt-dlp
2. Extract the recipe from the description
3. Use the channel name for attribution

## Backfilling New YouTube Channels

When adding a new YouTube channel to the cocktails app:

1. Create the channel directory structure:
   - `packages/data/data/recipes/youtube-channel/CHANNEL_SLUG/`
   - `packages/data/data/recipes/youtube-channel/CHANNEL_SLUG/_source.json`

2. Backfill videos to create GitHub issue with all available videos:

   ```bash
   yarn youtube-sync --channel CHANNEL_SLUG --days 365 --dry-run
   ```

3. Review the dry-run output to see what videos will be listed

4. Run without dry-run to create the issue:
   ```bash
   yarn youtube-sync --channel CHANNEL_SLUG --days 365
   ```

This creates a GitHub issue listing all videos from the channel that don't have recipes yet.

## YouTube API Configuration

The sync tool supports two methods for fetching videos:

1. **YouTube Data API v3** (Recommended) - Reliable, fast, and works in CI environments
   - Set `YOUTUBE_API_KEY` environment variable with your API key
   - Get a free API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - 50 quota units/day = ~1,667 API calls (more than enough for this use case)
   - Add as GitHub secret: Repository Settings → Secrets → Actions → `YOUTUBE_API_KEY`

2. **yt-dlp** (Fallback) - Used automatically if API key not available
   - Works locally but may be blocked by YouTube in CI environments
   - No configuration needed, but less reliable in automated contexts

The tool automatically tries the API first (if key available), then falls back to yt-dlp if needed.

## Channel Video Sync

A GitHub Action runs weekly to check all channels for new videos and creates an issue if any are found.

To manually trigger: Run the workflow dispatch for `youtube-sync.yml` in GitHub Actions.

## Available Options

- `--dry-run` - Test without creating GitHub issues
- `--days <number>` - Number of days to look back for videos (default: 7)
- `--channel <slug>` - Only process a specific channel by slug
- `--help` - Show help message
