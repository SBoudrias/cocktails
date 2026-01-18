'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ListConfig } from '@/modules/lists/type';
import IndexBar from '../IndexBar';
import { LinkList } from '../LinkList';

export default function IndexedList<const T>({
  items,
  renderItem,
  config,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config: ListConfig<T>;
}) {
  const [activeIndex, setActiveIndex] = useState<string | undefined>(undefined);

  // Compute which indexes have content
  const availableIndexes = useMemo(() => {
    const { groupBy } = config;
    const groups = new Set<string>();
    for (const item of items) {
      groups.add(groupBy(item));
    }
    return groups;
  }, [items, config]);

  // Set up Intersection Observer to track visible sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible header
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const topEntry = visibleEntries[0];
        if (topEntry) {
          const index = topEntry.target.textContent?.trim();
          if (index) {
            setActiveIndex(index);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '-10% 0px -80% 0px',
      },
    );

    // Observe all group headers
    const headers = document.querySelectorAll('[id^="group-header-"]');
    headers.forEach((header) => observer.observe(header));

    return () => observer.disconnect();
  }, [items]);

  const handleIndexSelect = useCallback((index: string) => {
    const header = document.getElementById(`group-header-${index}`);
    if (header) {
      header.scrollIntoView({ behavior: 'instant', block: 'start' });
      setActiveIndex(index);
    }
  }, []);

  return (
    <>
      <LinkList items={items} renderItem={renderItem} config={config} />
      <IndexBar
        activeIndex={activeIndex}
        availableIndexes={availableIndexes}
        onIndexSelect={handleIndexSelect}
      />
    </>
  );
}
