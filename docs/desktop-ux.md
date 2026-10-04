# Desktop UX

The app is a mobile-first single column stretched onto desktop. This documents the audit, the design we shipped for `>=md` (900px+), and what we deliberately left as follow-ups.

## Audit (measured, not eyeballed)

Metrics captured with headless Chrome (playwright-core) against the live deploy at 1440x900 and 390x844, reading `getBoundingClientRect` on key elements (`out/*.json` in the PR description lists the numbers):

| Page                     | Content column | Position at 1440 | Scroll height | List items |
| ------------------------ | -------------- | ---------------- | ------------- | ---------- |
| Home                     | 600px          | x=420            | 2194px        | 30         |
| All Recipes              | 600px          | x=420            | 181,298px     | 2586       |
| Category (gin)           | 600px          | x=420            | 26,725px      | 382        |
| Authors list             | 600px          | x=420            | 14,102px      | 245        |
| Search "dai"             | 600px          | x=420            | 5289px        | 70         |
| Source (Minimalist Tiki) | 600px          | x=420            | 9843px        | 128        |
| Saline calculator        | 600px          | x=420            | 900px         | 0          |

At 1440px, 840px of the viewport (58%) is empty margin. The only wayfinding is the home icon in the top bar (and the OS back button); there is no persistent navigation, no hover/focus affordances beyond MUI defaults, and no keyboard path into search.

## Design

### Persistent sidebar nav (>=md)

A fixed-width (272px) left sidebar, sticky below the top bar, with its own scroll:

- **Search box** at the top; Enter navigates to the all-recipes list with the search term applied.
- **Browse**: All Recipes, Recently Added, Non-Alcoholic, Milk-Clarified.
- **Categories**: the 165 root categories grouped by `categoryType` (Spirits, Liqueurs, Wines, Beers, Bitters, Syrups, Sodas, Other) as collapsible groups, collapsed by default.
- **Sources**: Books, YouTube Channels, Podcasts.
- **Calculators** and **Other lists** (authors, bars, ingredients, bottles).

The top bar stays: it carries the current page title and remains the anchor on mobile. Below `md` the sidebar is not rendered at all — the mobile layout is byte-for-byte the same component tree as before.

### Horizontal space

- The content column grows from `maxWidth: 600` to `maxWidth: 720` at `md`+, centered in the space right of the sidebar (at 1440: sidebar 272px + content 720px, leaving ~224px breathing room each side instead of a 420px void).
- Calculator forms inherit this width: the paired number inputs go from ~290px to ~350px each. No calculator-specific layout code needed.
- Home page sections (All Recipes, Calculators, By Books, By YouTube, By Podcasts, Other lists) flow into a 2-column grid at `md`, each section keeping its paper card.

### Two-column lists: deliberately not done

The long lists (all recipes: 181k px of scroll) are grouped by first letter with subheaders. CSS multi-columns on grouped lists either split groups across columns or strand tall groups (a letter group can be taller than the viewport, which `break-inside: avoid` cannot express). A real fix is the `IndexedList` work in PR #90 — noted as follow-up. Search-result pages (flat lists) are also left single-column for consistency with that follow-up.

### Hover / focus

- Global `:focus-visible` ring (2px, `info.light`) — keyboard nav becomes visible everywhere, which matters once `/` shortcuts exist.
- Standalone links underline on hover (`MuiLink` override). List rows keep MUI's hover background.

### `/` focuses search

A global keydown listener (ignored while typing in an input) focuses the first `input[type="search"]`: on desktop that's the sidebar search; on list pages without a sidebar (mobile) it's the page search box. If the current page has no search input, `/` does nothing (same as today).

## Mobile 390px: unchanged

All changes are gated behind `md` media queries via `sx`. The 390px metrics were captured before and after; the numbers are identical (see PR description).

## Follow-ups (files owned by PR #90)

- `SearchableList` / `LinkList`: adopt two-column layout for flat (searching) lists at `>=md`.
- `IndexedList` / `IndexBar`: index-bar navigation on desktop, which replaces the need for multi-column grouped lists.
- `BookSourceClient`: chapter list could use the same grid treatment as the home page.
