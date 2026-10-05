# Desktop UX

The mobile-first index gains persistent wayfinding at `md` (900px), without changing its mobile reading column. This describes the revised design following [the review of PR #476](https://github.com/SBoudrias/cocktails/pull/476#pullrequestreview-5407257759), which evaluated head `78f25b1fb351`.

## Desktop shell

- The centered shell is at most 1200px wide: a 272px navigation pane and a reading column at most 720px wide. Flex children use `minWidth: 0`; home grid tracks also have a zero minimum, so long names cannot push content past the 900px viewport.
- The top bar remains viewport-wide, but its title and page filter align with the reading column rather than the viewport's center. Below `md`, its original geometry is retained.
- The sidebar sticks 64px below the top bar and scrolls independently. Horizontal document overflow uses `clip`, not `hidden`: clipping does not introduce the overflow ancestor that previously broke sticky positioning.
- A keyboard-visible **Skip to content** link bypasses the navigation and focuses the main landmark.

## Navigation hierarchy

**Browse** keeps All Recipes, Recently Added, Non-Alcoholic, and Milk-Clarified immediately available. **Calculators**, **Sources**, **Categories**, and **Lists** are disclosures rather than an always-expanded catalogue. Collapsed home navigation fits in the initial pane at both 1440×900 and 900×900.

Sources contain Books, YouTube Channels, and Podcasts. Categories contain the ingredient-type groups. Children are visibly indented; long labels wrap instead of losing their identifying suffixes. Calculator labels and order match home.

The branch containing the current URL opens on direct navigation, reload, and client-side route changes. Links expose `aria-current="page"`; active branches remain highlighted even when the user closes them. Normally only root categories are listed, but a directly loaded subtype is included in its type group so it also has a current link.

Every disclosure has `aria-expanded` and a stable `aria-controls` target. Controlled panel wrappers remain mounted, while closed panels unmount their links to avoid stray tab stops. Navigation subheaders explicitly disable sticky behavior; several transparent headers can no longer occupy the same top edge during pane scrolling.

## Search contract

The two scopes have different visible labels and behavior:

- **Search all recipes** in the sidebar is a global form. Enter or its submit arrow opens All Recipes with the trimmed term. Typing is a draft, not a current-page filter. There is no sidebar Clear button that could be mistaken for resetting an active filter.
- The top bar's **Filter this page** updates the URL-backed filter of the category, source, or list being viewed. Its Clear resets that filter. On All Recipes, this is labeled **All recipes** and the sidebar form is omitted: one editable search and one Clear own the global filter.

Bare `/` prefers the current page's filter. On desktop pages without a filter, it focuses the global launcher and reveals it inside the navigation pane without moving the document. Hidden mobile navigation never supplies a target; mobile home still has no search input. Modified shortcuts, composing events, already-handled events, inputs, textareas, selects, and contenteditable text are ignored.

## Home and reading width

Home stays single-column at 900px. At `lg` (1200px), sections form a two-column grid, with the All Recipes/Recently Added card spanning both columns rather than leaving an empty cell beside a tall calculator card.

Source rows keep their original mobile layout. At desktop widths, counts and chevrons are non-shrinking, in-flow flex columns; source names can wrap in the remaining width. This reserves space for both `477` and its chevron and keeps full names readable. Reading pages and calculators use the 720px maximum without individual layout changes.

## Hover and keyboard focus

Plain elements retain the global 2px cyan `:focus-visible` outline. MUI ButtonBase controls use MUI's `theme.focusVisible` configuration, which wins against their `outline: 0` reset. This covers navigation links, disclosures, and icon buttons without relying on a weak global selector. Plain links underline on hover; list rows retain their MUI hover background.

## Mobile parity: scope and correction

The original PR's blanket “byte-for-byte unchanged” claim was incorrect. Its block outer shell let the saline footer rise from y=494 to y=332.515625 at 390×844. The outer shell is again a viewport-height flex column on mobile, and the content grows above the footer. The corrected footer starts at **y=494**, with document height **844px**, matching the review's baseline geometry.

The navigation is CSS-hidden below `md`, **not unmounted**. Hidden controls are outside normal tab and accessibility navigation. Mobile toolbar, home ordering, source row layout, and calculator form styles are retained. The skip link and corrected shortcut/accessibility behavior are intentional additions; geometry checks do not establish equivalence of the entire DOM or coverage of every page.

The screenshot commit `78f25b1fb351` remains untouched. Its historical “after” images predate these fixes and must not be used as evidence of the corrected layout.

## Regression verification

`apps/web/tools/check-desktop-ux.ts` drives headless Chrome through CDP using Node's built-in WebSocket, with a throwaway browser profile. It checks layout and interactions at 1440×900, 900×900, and 390×844: document/pane scrolling, actual text/count non-intersection, single-filter/Clear behavior, global submit, Back, direct category/source URLs, disclosure state, shortcut scope, skip navigation, computed MUI focus outlines, and the short-page mobile footer.

Run against a local dev server (or a server mapping the production export to `/cocktails`):

```sh
# First terminal
yarn dev

# Second terminal, from the repo root
BASE_URL=http://127.0.0.1:3000/cocktails node apps/web/tools/check-desktop-ux.ts
```

`CHROME_BINARY` overrides the macOS Chrome default. `SCREENSHOT_DIR` optionally saves captures. The script only accepts localhost URLs and never uses an existing browser profile.

The fixes were checked against a local production export on 2026-10-05 with Chrome **154.0.8037.93**: **50 browser checks** and **503 tests across 51 files** passed. All workspace TypeScript checks, oxlint, oxfmt, and the production build also passed.

Installed Next was **16.3.6**, while the lockfile requests **16.3.7**. Local Yarn fetch hit the environment's per-file write cap, so shared dependencies were copied. Direct binaries were used initially; exporting the worktree's `node_modules/.bin` in `PATH` also enabled the normal pre-push checks: `yarn lint`, `yarn test` (with coverage), and `yarn check-data` all passed. CI must still validate the locked dependency versions. Safari, Firefox, physical devices, and screen-reader announcements were not tested.

## Follow-ups (PR #90)

- `SearchableList` / `LinkList`: two-column layout for flat search results.
- `IndexedList` / `IndexBar`: long-list index navigation.
- `BookSourceClient`: chapter layout.

Those shared list components are deliberately not changed by these fixes.
