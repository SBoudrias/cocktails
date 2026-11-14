'use client';

import { Box, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useState } from 'react';
import { match } from 'ts-pattern';

// Fixed rail holding the viewport centering. It receives the pointer drag:
// touch-action and user-select apply to everything inside it
const Rail = styled('div')(({ theme }) => {
  const toolbarMinHeight = Number(theme.mixins.toolbar.minHeight ?? 56);

  return {
    position: 'fixed',
    right: 0,
    // Center on the content area (viewport minus the fixed toolbar), not the
    // full viewport, so the bar reads as centered next to the list on mobile
    top: `calc(50% + ${toolbarMinHeight / 2}px)`,
    transform: 'translateY(-50%)',
    // Above page content (rows, toggle) but below the app bar
    zIndex: theme.zIndex.appBar,
    touchAction: 'none',
    userSelect: 'none',
  };
});

const Container = styled('nav')(({ theme }) => {
  const toolbarMinHeight = Number(theme.mixins.toolbar.minHeight ?? 56);

  return {
    // Muted overlay, but distinct: a dark glass reads as its own layer
    // against both the page background and the lighter list cards, unlike
    // paper-tinted translucency which blends into the rows
    backgroundColor: alpha(theme.palette.common.black, 0.4),
    color: theme.palette.text.primary,
    backdropFilter: 'blur(6px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(0.25, 0.25),
    // Letters shrink on short viewports instead of overflowing: they stay
    // reachable and share the height evenly, which the drag mapping relies on
    maxHeight: `calc(100vh - ${toolbarMinHeight * 2}px)`,
  };
});

const Letter = styled('button')<{ $active?: boolean; $hasContent?: boolean }>(
  ({ theme, $active, $hasContent }) => ({
    background: 'none',
    border: 'none',
    padding: theme.spacing(0.125, 0.5),
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    fontWeight: $active ? 700 : 500,
    color: $hasContent
      ? $active
        ? theme.palette.primary.light
        : theme.palette.text.primary
      : alpha(theme.palette.text.primary, 0.35),
    cursor: $hasContent ? 'pointer' : 'default',
    lineHeight: 1.3,
    // Compact column: the bar overlays list rows (chevrons sit in MUI's
    // 56px secondaryAction zone), so the rail stays as narrow as readable
    minWidth: 22,
    minHeight: 0,
    overflow: 'hidden',
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.light}`,
      borderRadius: theme.shape.borderRadius,
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: 20,
      fontSize: '0.55rem',
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

// Visually hidden: the bubble shows the index, this announces it (with the
// chapter name in chapter mode)
const DragStatus = styled('div')({
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

// The index itself when it has content, else the next one with content,
// else the previous one
function findNearestAvailable(
  indexes: string[],
  availableIndexes: Set<string>,
  index: string,
) {
  const position = indexes.indexOf(index);
  if (position === -1) return undefined;

  const isAvailable = (candidate: string) => availableIndexes.has(candidate);
  return (
    indexes.slice(position).find(isAvailable) ??
    indexes.slice(0, position).findLast(isAvailable)
  );
}

export default function IndexBar({
  indexes,
  activeIndex,
  availableIndexes,
  onIndexSelect,
  indexInfo,
  ariaLabel = 'Alphabet index',
}: {
  indexes: string[];
  activeIndex?: string;
  availableIndexes: Set<string>;
  onIndexSelect: (index: string, options: { focus: boolean }) => void;
  indexInfo?: (index: string) => string | undefined;
  ariaLabel?: string;
}) {
  const [drag, setDrag] = useState<{ index: string; y: number } | null>(null);

  // Letters share the rail's height evenly, so the index under the pointer is
  // arithmetic on a fresh rect: nothing cached can drift if the bar moves
  // mid-drag. Clamped and ignoring X like the native iOS index: past either
  // end, or far left of the bar, the drag stays on the nearest letter
  const scrubTo = (rail: HTMLElement, clientY: number) => {
    const { top, height } = rail.getBoundingClientRect();
    const position = Math.floor(((clientY - top) / height) * indexes.length);
    const index = indexes[clamp(position, indexes.length - 1)];
    if (!index) return;

    const target = findNearestAvailable(indexes, availableIndexes, index);
    const previousTarget =
      drag && findNearestAvailable(indexes, availableIndexes, drag.index);
    setDrag({ index, y: clientY });
    // Pointermove fires many times per letter: only scroll when the target changes
    if (target && target !== previousTarget) onIndexSelect(target, { focus: false });
  };

  // Pointer events unify mouse, touch and pen. The rail captures the pointer,
  // so the drag keeps tracking outside the bar, and the browser fires
  // lostpointercapture however the drag ends (release, cancel, removal)
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Right and middle clicks never start a drag
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubTo(e.currentTarget, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (drag) scrubTo(e.currentTarget, e.clientY);
  };

  // A pointer tap already activated on pointerdown. A click with no pointer
  // behind it (detail 0) is a keyboard or assistive-tech activation
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, index: string) => {
    if (e.detail !== 0) return;
    const target = findNearestAvailable(indexes, availableIndexes, index);
    if (target) onIndexSelect(target, { focus: true });
  };

  // Roving focus: one tab stop for the whole bar, arrows move between letters
  // with content
  const tabStop =
    activeIndex && availableIndexes.has(activeIndex)
      ? activeIndex
      : indexes.find((index) => availableIndexes.has(index));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const letters = [
      ...e.currentTarget.querySelectorAll<HTMLElement>('[data-index]'),
    ].filter((letter) => availableIndexes.has(letter.dataset.index ?? ''));
    const position = letters.findIndex((letter) => letter === document.activeElement);
    const next = match(e.key)
      .with('ArrowDown', () => position + 1)
      .with('ArrowUp', () => position - 1)
      .with('Home', () => 0)
      .with('End', () => letters.length - 1)
      .otherwise(() => null);
    if (next == null) return;

    e.preventDefault();
    letters[clamp(next, letters.length - 1)]?.focus();
  };

  return (
    <>
      <Rail
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onLostPointerCapture={() => setDrag(null)}
      >
        <Container aria-label={ariaLabel} onKeyDown={handleKeyDown}>
          {indexes.map((index) => {
            const info = indexInfo?.(index);

            return (
              <Letter
                key={index}
                data-index={index}
                $active={activeIndex === index}
                $hasContent={availableIndexes.has(index)}
                onClick={(e) => handleClick(e, index)}
                tabIndex={index === tabStop ? 0 : -1}
                aria-label={`Jump to ${info ?? (index === '#' ? 'numbers' : index)}`}
                aria-current={activeIndex === index ? 'true' : undefined}
              >
                {index}
              </Letter>
            );
          })}
        </Container>
      </Rail>

      {/* Always mounted, so the live region announces each step of a drag */}
      <DragStatus role="status">
        {drag ? (indexInfo?.(drag.index) ?? drag.index) : ''}
      </DragStatus>
      {drag && (
        <Indicator
          aria-hidden
          sx={{ top: drag.y, transform: 'translateY(-50%)', right: { xs: 40, sm: 44 } }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            {drag.index}
          </Typography>
        </Indicator>
      )}
    </>
  );
}
