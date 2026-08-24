---
name: youtube
description: Fetch video metadata from YouTube URLs using yt-dlp, extract cocktail recipe details from descriptions, and plan or execute YouTube channel recipe backfills with youtube-inventory batches. Use when the user provides a YouTube URL, asks to get details from a YouTube video, or asks to backfill recipes from a YouTube channel.
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

## Backfilling YouTube Channels

For historical backfills or agent teams, start by generating an inventory. This
uses flat YouTube playlist discovery by default so large channels can be audited
by video ID and title without waiting for a full metadata crawl. The generated
batch files exclude videos already referenced by recipe JSON by default and
include enough context for agents to decide whether to create a new recipe, add
a ref to an existing recipe, skip the video, or report uncertainty.

```bash
yarn youtube-inventory \
  --channel CHANNEL_SLUG \
  --max-results 200 \
  --batch-size 8 \
  --output-dir tmp/youtube-inventory/CHANNEL_SLUG \
  --sort oldest
```

Use `--fetch-mode full` only for a smaller audit where upload dates from the
inventory step matter. The default `--fetch-mode flat` may write
`uploadDate: unknown`; use `playlistIndex` and the video URL as the assignment
context, then fetch full metadata for only the videos in the assigned batch.

Use `--include-referenced` when auditing videos that may contain additional
unmodeled recipes even though the video ID already appears in a recipe ref. Use
`--reviewed-file tmp/youtube-inventory/CHANNEL_SLUG/reviewed.json` to exclude
temporary `skip` or `uncertain` decisions while regenerating batches. Do not
store this ledger in `_source.json` or commit it to the recipe dataset. Use
`--include-reviewed` only when you want those temporary reviewed videos back in
the generated batches. Use `--dry-run` to preview the index and first batch
without writing files.

When processing an inventory batch:

1. Fetch metadata for each video using this skill.
2. Split multi-recipe videos into separate recipe candidates and use
   `refs[].start` when useful.
3. Search existing recipes before creating a new file.
4. Add a YouTube ref to an existing book or channel recipe when the formula
   matches.
5. Create a new `youtube-channel/CHANNEL_SLUG` recipe only when the video
   version is distinct.
6. **Name new recipes per the naming convention**: a parenthetical in a recipe
   name is reserved for authorship attribution (an original or named
   adaptation) and only when disambiguation from another version of the same
   drink **within the same channel** is needed. Do not use the channel name in
   parentheses (e.g. avoid `Mai Tai (Make and Drink)`); that wrongly implies
   the channel authored the recipe. Only versions that **diverge from the
   accepted/common industry recipe** need disambiguation — the accepted recipe
   itself uses the plain name directly (e.g. `Ramos Gin Fizz` + `Ramos Gin
Fizz (7 Up)`, `Nui Nui` + `Nui Nui (Holiday)`). Disambiguate divergent
   versions with numbering (`no. 1`, `no. 2`), provenance (the bar, book, or
   author behind that version), or a date only when the date is a meaningful
   version identifier (e.g. a historical recipe year like `Zombie (1930)`) —
   never the video upload year. Drop the parenthetical entirely when there is
   only one version of that drink in the channel.
7. Report `create`, `add-ref`, `skip`, or `uncertain` for every video.
8. Keep `skip` and `uncertain` review state in a temporary reviewed file only
   if you need to resume or regenerate batches.
9. Run `yarn check-data` after edits.

## Adding New YouTube Channels

When adding a new YouTube channel to the cocktails app:

1. Create the channel directory structure:
   - `packages/data/data/recipes/youtube-channel/CHANNEL_SLUG/`
   - `packages/data/data/recipes/youtube-channel/CHANNEL_SLUG/_source.json`

2. Generate a historical inventory for agent backfill:

   ```bash
   yarn youtube-inventory --channel CHANNEL_SLUG --sort oldest
   ```

3. For weekly monitoring, create a GitHub issue with recent videos:

   ```bash
   yarn youtube-sync --channel CHANNEL_SLUG --days 365 --dry-run
   ```

4. Review the dry-run output to see what videos will be listed

5. Run without dry-run to create the issue:
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
