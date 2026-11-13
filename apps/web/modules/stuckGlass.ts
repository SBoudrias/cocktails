import type { CSSProperties } from 'react';

/**
 * The moonlit glass of the fixed app bar (see MuiAppBar in theme.tsx):
 * translucent night sky and a blur. A sticky group header pinned below the
 * app bar wears it, so the rows sliding underneath read as scrolling beneath
 * glass — while in flow it stays transparent, showing the page behind it.
 */
export const stuckGlass: CSSProperties = {
  backgroundColor: 'rgba(10, 20, 32, 0.9)',
  backdropFilter: 'blur(8px)',
};
