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

Creates a full channel inventory and writes agent-sized backfill batches. Use
this for historical backfills such as Make and Drink.

```bash
yarn youtube-inventory \
  --channel make-and-drink \
  --batch-size 8 \
  --output-dir tmp/youtube-inventory/make-and-drink \
  --sort oldest
```

Useful options:

- `--channel <slug>`: tracked `youtube-channel` source slug. Defaults to
  `make-and-drink`.
- `--max-results <number>`: maximum videos to fetch. Defaults to `500`.
- `--all`: fetch all available channel videos.
- `--include-referenced`: include videos that already appear in `refs` so agents
  can audit multi-recipe videos.
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

## Backfill Flow

1. Run `yarn youtube-inventory --channel make-and-drink`.
2. Assign one generated batch file per agent.
3. For each video, the agent should decide `create`, `add-ref`, `skip`, or
   `uncertain`.
4. Add a YouTube ref to an existing book or channel recipe when the formula
   matches.
5. Create a new `youtube-channel/make-and-drink` recipe only when the video
   version is distinct.
6. Run `yarn check-data` after recipe edits.

For final validation, run:

```bash
yarn check-data
yarn vitest --run
yarn lint
```

## YouTube Access

Set `YOUTUBE_API_KEY` to use YouTube Data API v3. The tools fall back to
`yt-dlp` when no API key is configured, but large channel inventories are more
reliable with the API.
