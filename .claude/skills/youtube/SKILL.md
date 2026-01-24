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
   - `src/data/recipes/youtube-channel/CHANNEL_SLUG/`
   - `src/data/recipes/youtube-channel/CHANNEL_SLUG/_source.json`

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

## Channel Video Sync

A GitHub Action runs weekly to check all channels for new videos and creates an issue if any are found.

To manually trigger: Run the workflow dispatch for `youtube-sync.yml` in GitHub Actions.

## Available Options

- `--dry-run` - Test without creating GitHub issues
- `--days <number>` - Number of days to look back for videos (default: 7)
- `--channel <slug>` - Only process a specific channel by slug
- `--help` - Show help message
