---
name: youtube
description: Fetch video metadata from YouTube URLs using yt-dlp, and extract cocktail recipe details from the description via a Haiku subagent. Use when the user provides a YouTube URL or asks to get details from a YouTube video.
---

# YouTube Video Context

Fetch video information from YouTube using `yt-dlp`, then delegate description parsing to a cheap model.

## Instructions

When the user provides a YouTube URL (youtube.com or youtu.be):

1. **Fetch metadata** with `yt-dlp` (see commands below).
2. **Delegate extraction** of recipe-relevant info to a Haiku subagent (see "Extraction step").
3. Use the returned text as input for whatever the user actually asked for (creating recipe files, summarizing, etc.). Do recipe-file creation yourself — Haiku only returns text.

## Fetching metadata

```bash
# Get full JSON metadata
yt-dlp --skip-download --dump-json "VIDEO_URL"
```

This returns JSON with:

- `title` - Video title
- `description` - Full description (often contains recipes, timestamps, links)
- `channel` - Channel name (useful for source attribution)
- `upload_date` - Publication date

### Quick commands

```bash
# Get just the description
yt-dlp --skip-download --print description "VIDEO_URL"

# Get title and description
yt-dlp --skip-download --print "%(title)s" --print description "VIDEO_URL"
```

## Extraction step

After fetching the metadata, spawn a subagent with the `Agent` tool using `model: "haiku"` and `subagent_type: "general-purpose"` to read the description and pull out the recipe-relevant content.

**The Haiku subagent must return plain text only — no JSON, no recipe files, no schema mapping.** It is just a reading-and-summarizing step. The main model handles structuring the result into recipe files.

Pass the subagent the video `title`, `channel`, `upload_date`, and full `description`. Ask it to return a plain-text report covering:

- **Recipe(s)** — for each cocktail mentioned: name, ingredients with quantities, instructions, glassware, garnish. If the description mentions multiple recipes, list each separately.
- **Original author / creator** — who invented the cocktail (often distinct from the video host).
- **Bar / venue** — where the cocktail is served or originated.
- **Source attributions** — books, other channels, or people credited for the recipe.
- **Notes** — anything else useful for attribution: year created, style/category, riffs on classics, sponsor disclosures to ignore.
- **Uncertainty** — if a field is unclear or missing from the description, the subagent should say so explicitly rather than guess.

Keep the prompt short and focused; Haiku is reading a description, not writing a recipe file.

### Example subagent prompt

> You are extracting cocktail recipe info from a YouTube video description. Return plain text only — do NOT output JSON or attempt to format a recipe file.
>
> Video title: `<title>`
> Channel: `<channel>`
> Upload date: `<upload_date>`
>
> Description:
>
> ```
> <description>
> ```
>
> Report:
>
> - Recipe(s): name, ingredients with quantities, instructions, glassware, garnish (one block per cocktail)
> - Original author / creator (if credited)
> - Bar or venue (if mentioned)
> - Source attributions (books, other channels, people)
> - Notes worth keeping for attribution
> - Anything unclear or missing — say so explicitly
>
> Ignore sponsor reads, merch links, and unrelated promo.

## Examples

User: "Create a recipe from https://youtube.com/watch?v=xyz"

1. Fetch the video metadata with yt-dlp.
2. Delegate description parsing to a Haiku subagent (text output only).
3. Use the returned notes plus the channel name for attribution to write the recipe file yourself, following `packages/data/schemas/recipe.schema.json`.

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
