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

  // While dragging, the finger often leaves the bar (the bar is narrow and
  // elementFromPoint only hits it near the right edge). Map the pointer's Y
  // onto the bar's letter rows geometrically so the selection keeps following
  // the finger anywhere on screen until the pointer is released.
  const findIndexAtY = useCallback(
    (container: HTMLElement, clientY: number): string | null => {
      const letters = Array.from(container.querySelectorAll<HTMLElement>('[data-index]'));
      if (letters.length === 0) return null;

      const first = letters[0]?.getBoundingClientRect();
      const last = letters[letters.length - 1]?.getBoundingClientRect();
      if (!first || !last) return null;

      const rowTop = first.top;
      const rowBottom = last.bottom;
      const rowHeight = first.height;

      // Above/below the bar: clamp to the first/last letter so dragging past
      // the ends keeps working instead of dropping the selection
      const clamped = Math.min(Math.max(clientY, rowTop), rowBottom - 1);
      const position = Math.floor((clamped - rowTop) / rowHeight);
      return letters[position]?.getAttribute('data-index') ?? null;
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
      activateIndex(findIndexAtPoint(e.clientX, e.clientY));
    },
    [findIndexAtPoint, activateIndex],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      setPointerY(e.clientY);
      // The finger usually slides off the narrow bar mid-drag; elementFromPoint
      // only hits while over the bar, so fall back to mapping the pointer's Y
      // onto the bar's letter rows geometrically to keep following the finger
      activateIndex(
        findIndexAtPoint(e.clientX, e.clientY) ??
          findIndexAtY(e.currentTarget, e.clientY),
      );
    },
    [findIndexAtPoint, findIndexAtY, activateIndex],
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
