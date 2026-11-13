'use client';

import { ListSubheader } from '@mui/material';
import type { ListSubheaderProps } from '@mui/material/ListSubheader';
import { useRef } from 'react';
import { useStuck } from '#/hooks/useStuck';
import { stuckGlass } from '#/modules/stuckGlass';

/**
 * A group header that sticks below the fixed app bar: transparent while it
 * scrolls in flow, and moonlit glass — the app bar's own — once pinned, so
 * the rows sliding underneath stop bleeding through it.
 */
export default function StickyGroupHeader({ style, ...props }: ListSubheaderProps) {
  const ref = useRef<HTMLLIElement>(null);
  const stuck = useStuck(ref);

  return (
    <ListSubheader
      {...props}
      ref={ref}
      disableSticky={false}
      style={stuck ? { ...style, ...stuckGlass } : style}
    />
  );
}
