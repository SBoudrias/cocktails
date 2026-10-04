'use client';

import { Box, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useCallback, useRef, useState } from 'react';

const ALPHABET = [
  '#',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];

const Container = styled('nav')(({ theme }) => {
  const toolbarMinHeight = Number(theme.mixins.toolbar.minHeight ?? 56);

  return {
    position: 'fixed',
    // Translucent theme-aware background: rows, buttons and badges behind the
    // bar stay visible on narrow screens
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    color: theme.palette.text.primary,
    // Above page content (rows, toggle) but below the app bar
    zIndex: theme.zIndex.appBar + 1,
    backdropFilter: 'blur(4px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
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
      activateIndex(findIndexAtPoint(e.clientX, e.clientY));
    },
    [findIndexAtPoint, activateIndex],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      setPointerY(e.clientY);
      activateIndex(findIndexAtPoint(e.clientX, e.clientY));
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
