'use client';

import { Box, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useCallback, useRef, useState } from 'react';

const ALPHABET = [
  '#',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];

const Container = styled('nav')(({ theme }) => ({
  position: 'fixed',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  zIndex: theme.zIndex.speedDial,
  touchAction: 'none',
  userSelect: 'none',
  backgroundColor: theme.palette.common.black,
  borderRadius: theme.shape.borderRadius,
}));

const Letter = styled('button')<{ $active?: boolean; $hasContent?: boolean }>(
  ({ theme, $active, $hasContent }) => ({
    background: 'none',
    border: 'none',
    padding: theme.spacing(0.25, 0.75),
    margin: 0,
    fontSize: '0.65rem',
    fontWeight: $active ? 700 : 500,
    color: $hasContent
      ? $active
        ? theme.palette.primary.light
        : theme.palette.common.white
      : alpha(theme.palette.common.white, 0.4),
    cursor: 'pointer',
    lineHeight: 1.4,
    minWidth: 20,
    touchAction: 'none',
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.light}`,
      borderRadius: theme.shape.borderRadius,
    },
  }),
);

const Indicator = styled(Box)(({ theme }) => ({
  position: 'fixed',
  right: 40,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.9),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 9999,
}));

export default function IndexBar({
  indexes = ALPHABET,
  activeIndex,
  availableIndexes,
  onIndexSelect,
}: {
  indexes?: string[];
  activeIndex?: string;
  availableIndexes: Set<string>;
  onIndexSelect: (index: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement>(null);

  const findIndexAtPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      const element = document.elementFromPoint(clientX, clientY);
      return element?.getAttribute('data-index') ?? null;
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

  const handleIndexActivation = useCallback(
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

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const index = findIndexAtPoint(touch.clientX, touch.clientY);
      handleIndexActivation(index);
    },
    [findIndexAtPoint, handleIndexActivation],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setDragIndex(null);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const index = findIndexAtPoint(e.clientX, e.clientY);
      handleIndexActivation(index);
    },
    [isDragging, findIndexAtPoint, handleIndexActivation],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragIndex(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragIndex(null);
    }
  }, [isDragging]);

  const handleClick = useCallback(
    (index: string) => {
      handleIndexActivation(index);
    },
    [handleIndexActivation],
  );

  return (
    <>
      <Container
        ref={containerRef}
        aria-label="Alphabet index"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {indexes.map((index) => (
          <Letter
            key={index}
            data-index={index}
            $active={activeIndex === index}
            $hasContent={availableIndexes.has(index)}
            onClick={() => handleClick(index)}
            tabIndex={availableIndexes.has(index) ? 0 : -1}
            aria-label={`Jump to ${index === '#' ? 'numbers' : index}`}
            aria-current={activeIndex === index ? 'true' : undefined}
          >
            {index}
          </Letter>
        ))}
      </Container>

      {isDragging && dragIndex && (
        <Indicator>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            {dragIndex}
          </Typography>
        </Indicator>
      )}
    </>
  );
}
