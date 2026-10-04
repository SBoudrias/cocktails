'use client';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListConfig } from '#/modules/lists/type';
import IndexBar from '../IndexBar';
import { LinkList } from '../LinkList';

// Viewports below this have no margin between the centered content column
// and the fixed bar, so pages hosting the bar reserve room for it
export const INDEX_BAR_COMPACT_QUERY = '(max-width: 680px)';
const INDEX_BAR_INSET = 5;

export default function IndexedList<const T>({
  items,
  renderItem,
  config,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  config: ListConfig<T>;
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(INDEX_BAR_COMPACT_QUERY);

  const [activeIndex, setActiveIndex] = useState<string | undefined>(undefined);

  // Registry of mounted group-header elements, keyed by their header string.
  // LinkList reports mounts through onHeaderMount; headerCount bumps the
  // effects whenever the mounted set changes (e.g. group-mode toggle).
  // Unmounts aren't reported (a null node can't identify its header), so
  // prune() drops registry entries whose node left the document
  const headersRef = useRef(new Map<string, HTMLElement>());
  const [headerCount, setHeaderCount] = useState(0);

  const handleHeaderMount = useCallback((header: string, node: HTMLElement) => {
    headersRef.current.set(header, node);
    setHeaderCount((count) => count + 1);
  }, []);

  const pruneHeaders = useCallback(() => {
    const headers = headersRef.current;
    for (const [header, node] of headers) {
      if (!node.isConnected) {
        headers.delete(header);
      }
    }
  }, []);

  const indexes = useMemo(() => {
    if (config.indexes) return config.indexes;

    return ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
  }, [config]);

  // Indexes with at least one item, mapped through groupByIndex when the
  // index domain differs from the headers (chapter numbers)
  const availableIndexes = useMemo(() => {
    const available = new Set<string>();
    for (const item of items) {
      const header = config.groupBy(item);
      available.add(config.groupByIndex ? config.groupByIndex(header) : header);
    }
    return available;
  }, [items, config]);

  // Reset the active index when the index domain changes (e.g. the book
  // page's chapter <-> alphabetical toggle). Adjusting state during render
  // instead of in an effect keeps this a pure derivation of the config
  const [prevIndexes, setPrevIndexes] = useState(indexes);
  if (prevIndexes !== indexes) {
    setPrevIndexes(indexes);
    setActiveIndex(undefined);
  }

  // Track the topmost visible header. Re-created whenever the mounted
  // header set changes, so a group-mode toggle re-wires it to the new nodes
  useEffect(() => {
    pruneHeaders();
    const headers = [...headersRef.current.values()];
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const topEntry = visibleEntries[0];
        if (topEntry?.target instanceof HTMLElement) {
          const header = topEntry.target.dataset.header;
          if (header) {
            setActiveIndex(config.groupByIndex ? config.groupByIndex(header) : header);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '-10% 0px -80% 0px',
      },
    );

    for (const header of headers) {
      observer.observe(header);
    }

    return () => observer.disconnect();
  }, [headerCount, config, pruneHeaders]);

  const handleIndexSelect = useCallback(
    (index: string) => {
      pruneHeaders();
      const headers = headersRef.current;
      const target = [...headers.entries()].find(([header]) => {
        const headerIndex = config.groupByIndex ? config.groupByIndex(header) : header;
        return headerIndex === index;
      })?.[1];

      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        setActiveIndex(index);
      }
    },
    [config, pruneHeaders],
  );

  // Index -> label lookup for the bar's bubble and aria-labels (chapter names)
  const indexInfo = useMemo(() => {
    if (!config.groupByIndex) return undefined;

    const indexToHeader = new Map<string, string>();
    for (const item of items) {
      const header = config.groupBy(item);
      const index = config.groupByIndex(header);
      if (!indexToHeader.has(index)) {
        indexToHeader.set(index, header);
      }
    }

    return (index: string) => indexToHeader.get(index);
  }, [items, config]);

  // Keep the fixed app bar clear of scroll-jump targets: derive the offset
  // from the theme's toolbar height rather than a hard-coded pixel value
  const headerSx = useMemo(() => {
    const toolbarMinHeight = theme.mixins.toolbar.minHeight;

    return {
      scrollMarginTop: typeof toolbarMinHeight === 'number' ? toolbarMinHeight + 8 : 64,
    };
  }, [theme]);

  return (
    <>
      <Box sx={isCompact ? { pr: INDEX_BAR_INSET } : undefined}>
        <LinkList
          items={items}
          renderItem={renderItem}
          config={config}
          onHeaderMount={handleHeaderMount}
          headerSx={headerSx}
        />
      </Box>
      <IndexBar
        indexes={indexes}
        activeIndex={activeIndex}
        availableIndexes={availableIndexes}
        onIndexSelect={handleIndexSelect}
        indexInfo={indexInfo}
        ariaLabel={config.groupByIndex ? 'Chapter index' : 'Alphabet index'}
      />
    </>
  );
}
