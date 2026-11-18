'use client';

import { useRef } from 'react';
import { ListSubheader } from '#/components/ui/list';
import { useStuck } from '#/hooks/useStuck';
import { stuckGlass } from '#/modules/stuckGlass';

/**
 * A group header that sticks below the fixed app bar: transparent while it
 * scrolls in flow, and moonlit glass — the app bar's own — once rows slide
 * beneath it, so they stop bleeding through it. That lasts through the
 * group's bottom edge releasing the header over its own tail rows, and
 * through the bottom overscroll's rubber-band (useStuck measures between
 * the header and the rows, two boxes that travel together).
 *
 * The metrics: 16px vertical padding, 1.4rem line height, and the sticky
 * `top` at the app bar's height per orientation and breakpoint
 * (--app-bar-height).
 */
export default function StickyGroupHeader({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const stuck = useStuck(ref);

  return (
    <li
      id={id}
      ref={ref}
      // position: sticky inside the group; the rows scroll under it. The
      // background comes separately (useStuck): the header stays
      // see-through in flow and only wears glass once rows slide
      // beneath it.
      className="sticky z-1"
      style={{ top: 'var(--app-bar-height)', ...(stuck ? stuckGlass : null) }}
    >
      <ListSubheader>{children}</ListSubheader>
    </li>
  );
}
