'use client';

import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type {
  GroupedVirtuosoHandle,
  StateSnapshot,
  TopItemListProps,
} from 'react-virtuoso';
import { GroupedVirtuoso } from 'react-virtuoso';
import { useStuck } from '#/hooks/useStuck';
import { belowAppBar } from '#/modules/belowAppBar';
import { stuckGlass } from '#/modules/stuckGlass';

/**
 * Where each list was when the user left it, for a soft navigation back:
 * react-virtuoso's snapshot (measured sizes and scroll), and the topmost
 * visible row with its viewport position, which corrects what the snapshot
 * misses down to the pixel. Module state, so it outlives the unmount.
 */
const positions = new Map<string, { state: StateSnapshot; href: string; top: number }>();

// The fixed app bar covers the top of the window: this wrapper is the sticky
// element — it carries the theme's top offset and, once pinned, the moonlit
// glass that keeps the rows scrolling beneath it from bleeding through.
const TopItemList = styled('div')(({ theme }) => belowAppBar(theme.mixins.toolbar));

function StickyTopItemList({ children, style }: TopItemListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stuck = useStuck(ref);

  return (
    <TopItemList
      ref={ref}
      style={{ ...style, top: undefined, ...(stuck ? stuckGlass : null) }}
    >
      {children}
    </TopItemList>
  );
}

// Same footprint as a two-line link row, until the row's data loads.
const placeholder = (
  <ListItem divider aria-hidden>
    <ListItemText primary="…" secondary="…" />
  </ListItem>
);

/**
 * A long list grouped under sticky headers, rendered with react-virtuoso
 * against the window scroll: only the rows near the viewport are in the DOM.
 *
 * `groups` gives the shape of the whole list up front, so its full height
 * exists from the first render and rows loading later never move the page.
 * `items` holds the rows in list order; it may be shorter than the list (rows
 * still loading render as placeholders), and the first `items` are rendered
 * in the static HTML.
 */
export default function VirtualGroupedList<const T extends { href: string }>({
  groups,
  items,
  renderItem,
}: {
  groups: { label: string; count: number }[];
  items: T[];
  renderItem: (item: T) => ReactNode;
}) {
  const pathname = usePathname();
  const ref = useRef<GroupedVirtuosoHandle>(null);
  const [restore] = useState(() => positions.get(pathname));
  const mountedAt = useRef(0);
  const groupCounts = groups.map((group) => group.count);
  const totalCount = groupCounts.reduce((a, b) => a + b, 0);

  // Save the position right before a click on a row navigates away (a
  // capture listener runs before the link's own navigation).
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list == null) return;

    const savePosition = () => {
      const anchor = [...list.querySelectorAll<HTMLElement>('[data-item-index] a[href]')]
        .map((link) => ({
          href: link.getAttribute('href'),
          top: link.getBoundingClientRect().top,
        }))
        .find((link) => link.top > getAppBarHeight());
      ref.current?.getState((state) => {
        if (anchor?.href)
          positions.set(pathname, { state, href: anchor.href, top: anchor.top });
      });
    };

    list.addEventListener('click', savePosition, { capture: true });
    return () => list.removeEventListener('click', savePosition, { capture: true });
  }, [pathname]);

  // While the restored list settles (measurements, rows swapping in), keep
  // the anchor row where it was.
  const keepRestoredPosition = () => {
    if (restore == null) return;
    if (mountedAt.current === 0) mountedAt.current = performance.now();
    if (performance.now() - mountedAt.current > 1500) return;
    const link = document.querySelector(`[data-item-index] a[href="${restore.href}"]`);
    if (link == null) return;
    const delta = Math.round(link.getBoundingClientRect().top - restore.top);
    if (delta !== 0) window.scrollBy(0, delta);
  };

  return (
    <>
      {/* One list around the rows and the sticky header virtuoso renders
          apart from them. */}
      <List ref={listRef} disablePadding>
        <GroupedVirtuoso
          ref={ref}
          useWindowScroll
          groupCounts={groupCounts}
          initialItemCount={Math.min(items.length, totalCount)}
          increaseViewportBy={800}
          restoreStateFrom={restore?.state}
          itemsRendered={keepRestoredPosition}
          computeItemKey={(index) => items[index]?.href ?? `placeholder-${index}`}
          components={{ TopItemList: StickyTopItemList }}
          groupContent={(groupIndex) => (
            <ListSubheader component="div" role="heading" aria-level={2}>
              {groups[groupIndex]?.label}
            </ListSubheader>
          )}
          itemContent={(index) => {
            const item = items[index];
            return <Paper square>{item ? renderItem(item) : placeholder}</Paper>;
          }}
        />
      </List>
    </>
  );
}

function getAppBarHeight() {
  return document.querySelector('header')?.getBoundingClientRect().height ?? 0;
}
