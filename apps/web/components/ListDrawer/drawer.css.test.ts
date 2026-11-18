import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The sheet-sizing contract with ui-sdk's scroll-snap driver, guarded
// here because it is invisible to every DOM-level test: happy-dom lays
// nothing out, so only this file says the rules are still in the CSS.
const css = readFileSync(path.join(__dirname, 'drawer.css'), 'utf8');

describe('ListDrawer sheet sizing', () => {
  it('sizes the sheet within its own scroll viewport under the scroll-snap driver', () => {
    // The pin and the size must read the same box: wherever 100dvh
    // disagrees with the driver's fixed viewport, the sheet outgrows its
    // scroll container and the list's last rows land behind the browser
    // chrome, unreachable (the bug this guards).
    expect(css).toMatch(
      /\[data-slot='drawer-content'\]\[data-driver='scroll-snap'\]\s*{\s*height: calc\(100% - 120px - var\(--app-bar-height\)\);/,
    );
  });

  it('lifts the 85dvh cap for the near-full snap point', () => {
    // A rebase that drops the un-clamp makes the larger snap point land
    // short of the app bar with no error anywhere else.
    expect(css).toMatch(/\[data-slot='drawer-content'\]\s*{\s*height: calc\(100dvh/);
    expect(css).toMatch(/max-height: none;/);
  });
});
