import { cn } from 'cn';
import * as React from 'react';

// MUI Card's exact rendered geometry (measured, see the family's port notes):
// the 4px radius, Paper's elevation-1 shadow and its white-5% overlay
// gradient on top of the glass background. --radius-lg is 0.25rem here.
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'block overflow-hidden rounded-lg bg-card text-base text-card-foreground',
        'bg-[linear-gradient(rgb(255_255_255/0.05),rgb(255_255_255/0.05))]',
        'shadow-[0px_2px_1px_-1px_rgb(0_0_0/0.2),0px_1px_1px_0px_rgb(0_0_0/0.14),0px_1px_3px_0px_rgb(0_0_0/0.12)]',
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
      className={cn('flex flex-col justify-center px-4 py-4', className)}
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
        'p-4 pt-4 text-sm [[data-slot=card-header]+&]:pt-0 [[data-slot=card-content]+&]:pt-0',
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
