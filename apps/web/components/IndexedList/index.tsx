'use client';

import { useEffect, useRef, useState } from 'react';
import IndexBar from '#/components/IndexBar';
import { LinkList } from '#/components/LinkList';
import type { ListConfig } from '#/modules/lists/type';

const ALPHABET = [
  '#',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];

const identity = (header: string) => header;

function getGroups(list: HTMLElement | null) {
  return [...(list?.querySelectorAll<HTMLElement>('[data-header]') ?? [])];
}

export default function IndexedList<const T>({
  items,
  renderItem,
  config,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config: ListConfig<T>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<string | undefined>(undefined);

  // Index -> first group header under it. Its keys are the indexes with
  // content; chapter mode also uses it to label numbers with chapter names
  const headerByIndex = new Map<string, string>();
  for (const item of items) {
    const header = config.groupBy(item);
    const index = (config.groupByIndex ?? identity)(header);
    if (!headerByIndex.has(index)) headerByIndex.set(index, header);
  }

  // Track the topmost group crossing a band near the top of the viewport.
  // Observing whole groups (not their headers) keeps the active index right
  // while scrolling up through a long group, when no header is in the band
  useEffect(() => {
    const toIndex = config.groupByIndex ?? identity;
    const groups = getGroups(listRef.current);
    const crossing = new Set<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            crossing.add(entry.target);
          } else {
            crossing.delete(entry.target);
          }
        }

        // Groups are in document order: the first one crossing is the topmost
        const header = groups.find((group) => crossing.has(group))?.dataset.header;
        if (header) setActiveIndex(toIndex(header));
      },
      { rootMargin: '-10% 0px -80% 0px' },
    );

    for (const group of groups) {
      observer.observe(group);
    }

    return () => observer.disconnect();
  }, [items, config]);

  const handleIndexSelect = (index: string, { focus }: { focus: boolean }) => {
    const header = headerByIndex.get(index);
    const group = getGroups(listRef.current).find(
      (element) => element.dataset.header === header,
    );
    if (!group) return;

    group.scrollIntoView({ behavior: 'instant', block: 'start' });
    // A keyboard jump brings focus along, so Tab continues inside the section
    if (focus)
      group.querySelector<HTMLElement>('a[href]')?.focus({ preventScroll: true });
    setActiveIndex(index);
  };

  return (
    <div ref={listRef}>
      {/* Before the list, so keyboard users reach it without tabbing through every row */}
      <IndexBar
        indexes={config.indexes ?? ALPHABET}
        activeIndex={activeIndex}
        availableIndexes={new Set(headerByIndex.keys())}
        onIndexSelect={handleIndexSelect}
        indexInfo={config.groupByIndex ? (index) => headerByIndex.get(index) : undefined}
        ariaLabel={config.groupByIndex ? 'Chapter index' : 'Alphabet index'}
      />
      <LinkList items={items} renderItem={renderItem} config={config} />
    </div>
  );
}
