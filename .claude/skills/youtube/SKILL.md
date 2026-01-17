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
