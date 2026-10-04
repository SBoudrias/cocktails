'use client';

import { Box, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';

const ALPHABET = [
  '#',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];

const Container = styled('nav')(({ theme }) => {
  const toolbarMinHeight = Number(theme.mixins.toolbar.minHeight ?? 56);

  return {
    position: 'fixed',
    // Muted overlay: the list stays readable through the bar, no border or
    // frame — the letters themselves carry the affordance
    backgroundColor: alpha(theme.palette.background.paper, 0.55),
    color: theme.palette.text.primary,
    // Above page content (rows, toggle) but below the app bar
    zIndex: theme.zIndex.appBar + 1,
    backdropFilter: 'blur(6px)',
    right: 0,
    // Center on the content area (viewport minus the fixed toolbar), not the
    // full viewport, so the bar reads as centered next to the list on mobile
    top: `calc(50% + ${toolbarMinHeight / 2}px)`,
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0.375),
    maxHeight: `calc(100vh - ${toolbarMinHeight * 2}px)`,
    overflowY: 'auto',
    touchAction: 'none',
    userSelect: 'none',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  };
});

const Letter = styled('button')<{ $active?: boolean; $hasContent?: boolean }>(
  ({ theme, $active, $hasContent }) => ({
    background: 'none',
    border: 'none',
    padding: theme.spacing(0.25, 0.75),
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.65rem',
    fontWeight: $active ? 700 : 500,
    color: $hasContent
      ? $active
        ? theme.palette.primary.light
        : theme.palette.text.primary
      : alpha(theme.palette.text.primary, 0.35),
    cursor: $hasContent ? 'pointer' : 'default',
    lineHeight: 1.4,
    // 28px column: the 44px guideline is for primary controls; a secondary
    // navigation rail trades down for vertical density
    minWidth: 28,
    touchAction: 'none',
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.light}`,
      borderRadius: theme.shape.borderRadius,
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: 24,
      fontSize: '0.6rem',
    },
  }),
);

const Indicator = styled(Box)(({ theme }) => ({
  position: 'fixed',
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.9),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: theme.zIndex.tooltip + 1,
}));

export default function IndexBar({
  indexes = ALPHABET,
  activeIndex,
  availableIndexes,
  onIndexSelect,
  indexInfo,
  ariaLabel = 'Alphabet index',
}: {
  indexes?: string[];
  activeIndex?: string;
  availableIndexes: Set<string>;
  onIndexSelect: (index: string) => void;
  indexInfo?: (index: string) => string | undefined;
  ariaLabel?: string;
}) {
  const [dragIndex, setDragIndex] = useState<string | null>(null);
  const [pointerY, setPointerY] = useState<number | null>(null);
  // Suppresses the synthetic click that follows a pointer activation
  const pointerActivatedRef = useRef(false);

  // Drag anchor captured at pointerdown: which letter row the finger started
  // on, at what Y, and the row height. Moves are mapped as deltas from this
  // anchor, so toolbar collapse/expand and scroll jumps mid-drag (which
  // reposition the fixed bar) can't skew the letter mapping.
  const dragAnchorRef = useRef<{
    letters: HTMLElement[];
    y: number;
    position: number;
    rowHeight: number;
  } | null>(null);

  const clearDrag = useCallback(() => {
    setDragIndex(null);
    setPointerY(null);
  }, []);

  // Safety net for pointerups the container never sees: a context menu
  // (right-click), alt-tab, or an element removed mid-drag can swallow the
  // trailing pointerup or implicitly drop the capture, leaving the bubble
  // stuck on screen. Window listeners while dragging cover all of those and
  // are idempotent with the React handlers (re-clearing cleared state is a
  // no-op).
  const isDragging = dragIndex != null;
  useEffect(() => {
    if (!isDragging) return;

    const end = () => {
      // Let the trailing synthetic click (if any) pass before re-arming
      window.setTimeout(() => {
        pointerActivatedRef.current = false;
      });
      clearDrag();
    };

    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('contextmenu', end);
    window.addEventListener('blur', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('contextmenu', end);
      window.removeEventListener('blur', end);
    };
  }, [isDragging, clearDrag]);

  const findIndexAtPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      const element = document.elementFromPoint(clientX, clientY);
      return element?.closest('[data-index]')?.getAttribute('data-index') ?? null;
    },
    [],
  );

  const findNearestAvailableIndex = useCallback(
    (index: string): string | null => {
      if (availableIndexes.has(index)) {
        return index;
      }

      const indexPosition = indexes.indexOf(index);
      if (indexPosition === -1) return null;

      // Search forward for the next available index
      for (let i = indexPosition + 1; i < indexes.length; i++) {
        const candidate = indexes[i];
        if (candidate && availableIndexes.has(candidate)) {
          return candidate;
        }
      }

      // If nothing found forward, search backward
      for (let i = indexPosition - 1; i >= 0; i--) {
        const candidate = indexes[i];
        if (candidate && availableIndexes.has(candidate)) {
          return candidate;
        }
      }

      return null;
    },
    [indexes, availableIndexes],
  );

  const activateIndex = useCallback(
    (index: string | null) => {
      if (!index) return;

      setDragIndex(index);
      const targetIndex = findNearestAvailableIndex(index);
      if (targetIndex) {
        onIndexSelect(targetIndex);
      }
    },
    [findNearestAvailableIndex, onIndexSelect],
  );

  // Pointer events unify mouse and touch: the container captures the pointer
  // so the drag keeps working (and ends cleanly) outside the bar
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setPointerY(e.clientY);
      pointerActivatedRef.current = true;

      // Anchor the drag: which letter row the finger is on at which Y. Moves
      // map as deltas from this anchor, so toolbar collapse/expand and scroll
      // jumps mid-drag (which reposition the fixed bar) can't skew the mapping
      const letters = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[data-index]'),
      );
      const first = letters[0]?.getBoundingClientRect();
      const last = letters[letters.length - 1]?.getBoundingClientRect();
      const rowHeight = first?.height ?? 0;
      const hitIndex = findIndexAtPoint(e.clientX, e.clientY);
      if (letters.length > 0 && first && last && rowHeight > 0) {
        const hitRect = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest('[data-index]')
          ?.getBoundingClientRect();
        const position = hitRect
          ? Math.floor((hitRect.top + hitRect.height / 2 - first.top) / rowHeight)
          : Math.floor(
              (Math.min(Math.max(e.clientY, first.top), last.bottom - 1) - first.top) /
                rowHeight,
            );
        dragAnchorRef.current = { letters, y: e.clientY, position, rowHeight };
      } else {
        dragAnchorRef.current = null;
      }

      activateIndex(hitIndex);
    },
    [findIndexAtPoint, activateIndex],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      setPointerY(e.clientY);

      // The finger usually slides off the narrow bar mid-drag; elementFromPoint
      // only hits while over the bar. Off the bar, map the finger's travel as
      // row deltas from the pointerdown anchor: stable even when the bar moves
      // under us (toolbar collapse, scroll jumps).
      const anchor = dragAnchorRef.current;
      const hit = findIndexAtPoint(e.clientX, e.clientY);
      if (hit) {
        activateIndex(hit);
      } else if (anchor) {
        const deltaRows = Math.round((e.clientY - anchor.y) / anchor.rowHeight);
        const position = Math.min(
          Math.max(anchor.position + deltaRows, 0),
          anchor.letters.length - 1,
        );
        activateIndex(anchor.letters[position]?.getAttribute('data-index') ?? null);
      }
    },
    [findIndexAtPoint, activateIndex],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Let the trailing synthetic click (if any) pass before re-arming
    window.setTimeout(() => {
      pointerActivatedRef.current = false;
    });
    setDragIndex(null);
    setPointerY(null);
  }, []);

  // Activation happens in the pointer handlers; click stays for keyboard
  // users, where no pointerdown precedes it
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (pointerActivatedRef.current) return;
      activateIndex(e.currentTarget.getAttribute('data-index'));
    },
    [activateIndex],
  );

  return (
    <>
      <Container
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {indexes.map((index) => {
          const info = indexInfo?.(index);

          return (
            <Letter
              key={index}
              data-index={index}
              $active={activeIndex === index}
              $hasContent={availableIndexes.has(index)}
              onClick={handleClick}
              tabIndex={availableIndexes.has(index) ? 0 : -1}
              aria-label={`Jump to ${info ?? (index === '#' ? 'numbers' : index)}`}
              aria-current={activeIndex === index ? 'true' : undefined}
            >
              {index}
            </Letter>
          );
        })}
      </Container>

      {dragIndex && pointerY != null && (
        <Indicator
          role="status"
          aria-label={indexInfo?.(dragIndex) ?? dragIndex}
          sx={{
            top: pointerY,
            transform: 'translateY(-50%)',
            right: { xs: 40, sm: 44 },
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            {dragIndex}
          </Typography>
        </Indicator>
      )}
    </>
  );
}
