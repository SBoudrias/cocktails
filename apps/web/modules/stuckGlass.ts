import type { CSSProperties } from 'react';

/**
 * The moonlit glass of the fixed app bar (see --header and the app bar in
 * components/AppBar): translucent night sky and a blur. A sticky group
 * header pinned below the app bar wears it, so the rows sliding underneath
 * read as scrolling beneath glass — while in flow it stays transparent,
 * showing the page behind it.
 */
export const stuckGlass: CSSProperties = {
  backgroundColor: 'var(--header)',
  backdropFilter: 'blur(8px)',
};
