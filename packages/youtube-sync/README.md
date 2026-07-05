# YouTube Sync

Utilities for tracking cocktail YouTube channels and turning channel videos into
recipe backfill work.

## Commands

### `yarn youtube-sync`

Checks tracked YouTube channels for recently uploaded videos that are not already
referenced by any recipe JSON file. By default, it looks back 7 days and creates
a GitHub issue.

```bash
yarn youtube-sync --dry-run
yarn youtube-sync --channel make-and-drink --days 30 --dry-run
```

Run without `--dry-run` only when you want to create the GitHub issue.

### `yarn youtube-inventory`

Creates a channel inventory and writes agent-sized backfill batches. Use this
for historical backfills such as Make and Drink.

By default, the command uses yt-dlp's flat playlist mode. That fetches stable
video IDs and titles quickly, compares them against recipe refs, and avoids the
slow full-metadata channel crawl that can stall on large archives. Batch agents
should fetch full video metadata only for the specific videos they are assigned.

```bash
yarn youtube-inventory \
  --channel make-and-drink \
  --max-results 200 \
  --batch-size 8 \
  --output-dir tmp/youtube-inventory/make-and-drink \
  --sort oldest
```

Useful options:

- `--channel <slug>`: tracked `youtube-channel` source slug. Defaults to
  `make-and-drink`.
- `--fetch-mode flat|full`: discovery mode. Defaults to `flat`. Use `full`
  only when you need upload dates from the inventory step and can tolerate a
  slower channel crawl.
- `--max-results <number>`: maximum videos to fetch from the channel playlist.
  Defaults to `500`.
- `--all`: fetch all available channel videos.
- `--include-referenced`: include videos that already appear in `refs` so agents
  can audit multi-recipe videos.
- `--include-reviewed`: include videos marked `skip` or `uncertain` in the
  channel `_source.json` `reviewedVideos` ledger.
- `--include-shorts`: include videos that are 60 seconds or shorter.
- `--batch-size <number>`: videos per batch. Defaults to `8`.
- `--format markdown|json|both`: batch output format. Defaults to `both`.
- `--sort oldest|newest`: batch order. Defaults to `oldest`.
- `--dry-run`: print the index and first batch preview without writing files.

## Output

The inventory command writes:

- `index.json`: summary, options, excluded videos, and generated batch files.
- `batch-001.md`, `batch-002.md`, etc.: prompts for recipe backfill agents.
- `batch-001.json`, `batch-002.json`, etc. when JSON output is enabled.

Videos already referenced by recipe JSON are excluded from batches by default
and listed in `index.json` with the recipe paths that reference them. Use
`--include-referenced` when you want agents to audit videos that may contain
additional unmodeled recipes.

Videos that have been reviewed but should not get a recipe ref can be recorded
in the channel `_source.json` under `reviewedVideos`. This is for durable
`skip` and `uncertain` decisions, such as ingredient-prep videos, equipment
videos, or videos where the available source does not provide a complete enough
formula. These are excluded from batches by default and listed in `index.json`
with reason `reviewed`.

Flat inventories may have `uploadDate: unknown`; use `playlistIndex` and
`source: flat` as the audit context. The channel playlist is newest-first, so
`--sort oldest` reverses that order when upload dates are unavailable.

## Backfill Flow

1. Run `yarn youtube-inventory --channel make-and-drink --max-results 200`.
2. Assign one generated batch file per agent.
3. For each video, the agent should decide `create`, `add-ref`, `skip`, or
   `uncertain`.
4. Fetch full metadata for each assigned video with yt-dlp or the `youtube`
   skill.
5. Add a YouTube ref to an existing book or channel recipe when the formula
   matches.
6. Create a new `youtube-channel/make-and-drink` recipe only when the video
   version is distinct.
7. Run `yarn check-data` after recipe edits.

For final validation, run:

```bash
yarn check-data
yarn vitest --run
yarn lint
```

## YouTube Access

Set `YOUTUBE_API_KEY` to use YouTube Data API v3. The tools fall back to
`yt-dlp` when no API key is configured. `youtube-sync` still benefits from the
API because it needs recent upload dates; `youtube-inventory` defaults to flat
yt-dlp discovery because historical backfills primarily need complete video ID
coverage.
