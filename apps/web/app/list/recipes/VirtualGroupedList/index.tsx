'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type {
  GroupedVirtuosoHandle,
  StateSnapshot,
  TopItemListProps,
} from 'react-virtuoso';
import { GroupedVirtuoso } from 'react-virtuoso';
import { ListSubheader } from '#/components/ui/list';
import { useStuck } from '#/hooks/useStuck';
import { stuckGlass } from '#/modules/stuckGlass';

/**
 * Where each list was when the user left it, for a soft navigation back:
 * react-virtuoso's snapshot (measured sizes and scroll), and the topmost
 * visible row with its viewport position, which corrects what the snapshot
 * misses down to the pixel. Module state, so it outlives the unmount.
 */
const positions = new Map<string, { state: StateSnapshot; href: string; top: number }>();

// The fixed app bar covers the top of the window: this wrapper is the sticky
// element — it carries the app bar's height as its top offset (per
// orientation and breakpoint) and, once rows slide beneath it, the moonlit
// glass that keeps them from bleeding through.
function StickyTopItemList({ children, style }: TopItemListProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The scroller that follows spans empty space above its first row (its
  // box carries the full list height), so resolve to the rows it has
  // actually rendered: they say where painted content is.
  const stuck = useStuck(ref, (el) => [
    ...(el.nextElementSibling?.querySelectorAll('[data-item-index]') ?? []),
  ]);

  return (
    <div
      ref={ref}
      className="sticky z-1"
      style={{ ...style, top: 'var(--app-bar-height)', ...(stuck ? stuckGlass : null) }}
    >
      {children}
    </div>
  );
}

// Same footprint as a two-line link row, until the row's data loads.
const placeholder = (
  <li className="flex w-full items-center border-b px-4 py-3 text-base">
    <span className="flex flex-1 flex-col gap-1">
      <span className="leading-[1.5]">…</span>
      <span className="text-xs leading-[1.35] text-muted-foreground">…</span>
    </span>
  </li>
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
        if (anchor?.href) {
          positions.set(pathname, { state, href: anchor.href, top: anchor.top });
        }
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
    // One list around the rows and the sticky header virtuoso renders apart
    // from them.
    <ul ref={listRef}>
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
          <ListSubheader role="heading" aria-level={2}>
            {groups[groupIndex]?.label}
          </ListSubheader>
        )}
        itemContent={(index) => {
          const item = items[index];
          return <div className="surface">{item ? renderItem(item) : placeholder}</div>;
        }}
      />
    </ul>
  );
}

function getAppBarHeight() {
  return document.querySelector('header')?.getBoundingClientRect().height ?? 0;
}
