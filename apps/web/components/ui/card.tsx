import { cn } from 'cn';
import * as React from 'react';

// MUI's spacing scale: 1 unit = 8px. The family's call sites place cards in
// the page flow with it (m={1} was sx m:1, m={2} was m:2).
export type CardMargin = 1 | 2;

// MUI Card's exact rendered geometry (measured, see the family's port notes):
// the 4px radius on top of the shared `surface` utility (the Paper glass,
// its overlay gradient and elevation-1 shadow).
function Card({
  className,
  m,
  ...props
}: React.ComponentProps<'div'> & { m?: CardMargin }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'overflow-hidden rounded-lg text-base text-card-foreground surface',
        m === undefined ? undefined : m === 1 ? 'm-2' : 'm-4',
        className,
      )}
      {...props}
    />
  );
}

// MUI CardHeader: 16px padding, the title and subheader stacked (its
// content column), vertically centered.
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col justify-center p-4', className)}
      {...props}
    />
  );
}

// MUI CardHeader title: this theme renders it on typography.h5 metrics
// (24px/400, 32px line-height), not the 20px v5 default.
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-2xl leading-8 font-normal', className)}
      {...props}
    />
  );
}

// MUI CardHeader subheader: body1 metrics, muted teal.
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
        // The theme collapses the top padding of a content block that
        // follows the header or another content block (MuiCardContent
        // styleOverrides' sibling rules).
        'p-4 text-sm [[data-slot=card-header]+&]:pt-0 [[data-slot=card-content]+&]:pt-0',
        className,
      )}
      {...props}
    />
  );
}

// MUI CardActions: 8px padding, children spaced 8px apart, pushed to the
// end by the app's usage (justify-content: 'end'). The theme drops its top
// padding when it follows a content block.
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
