import { cn } from 'cn';
import * as React from 'react';
import styles from './card.module.css';

// The card's margin step in the page flow, in 8px units.
export type CardMargin = 1 | 2;

// A card: the 4px radius on top of the shared `surface` utility (the glass
// fill, its overlay gradient and elevation shadow).
function Card({
  className,
  m,
  ...props
}: React.ComponentProps<'div'> & { m?: CardMargin }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'text-base text-card-foreground',
        styles.frame,
        m === undefined ? undefined : m === 1 ? 'm-2' : 'm-4',
        className,
      )}
      {...props}
    />
  );
}

// The card header: 16px padding, the title and subheader stacked, vertically
// centered.
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col justify-center p-4', className)}
      {...props}
    />
  );
}

// The header title: 24px/400 on a 32px line-height. A classless leading svg
// (an icon without its own size classes) is the title-glyph recipe —
// 24px, inline-block, 6px to its label — so titles don't repeat it at every
// icon; an svg that carries size-* classes opts out (globals.css already
// sits every svg on text-top).
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-2xl leading-8 font-normal',
        "[&>svg:not([class*='size-'])]:mr-1.5 [&>svg:not([class*='size-'])]:inline-block [&>svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...props}
    />
  );
}

// The header subheader: body metrics, muted teal.
function CardSubheader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-subheader"
      className={cn('text-base leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        // A content block that follows the header or another content block
        // loses its top padding, so stacked blocks read as one section.
        'p-4 text-sm [[data-slot=card-content]+&]:pt-0 [[data-slot=card-header]+&]:pt-0',
        className,
      )}
      {...props}
    />
  );
}

// The actions row: 8px padding, children spaced 8px apart, pushed to the
// row's end. It loses its top padding when it follows a content block.
function CardActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-actions"
      className={cn(
        'flex items-center justify-end gap-2 p-2 [[data-slot=card-content]+&]:pt-0',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardSubheader, CardContent, CardActions };
