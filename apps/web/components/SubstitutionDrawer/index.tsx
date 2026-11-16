'use client';

import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@ui-sdk/react/drawer';
import { ArrowLeftRight, X } from 'lucide-react';
import type { ReactNode } from 'react';

// The mobile substitution entry point: a chip row right under the page
// title (after the category chips) opening a bottom sheet that holds the
// page's substitution lists, so they stop pushing the recipe list down the
// page. The 600px split is the app chrome's own breakpoint (AppBar padding,
// --app-bar-height): below it this trigger shows and the page hides its
// inline lists; at or above it the trigger is hidden and the inline lists
// stay exactly as they were.
export default function SubstitutionDrawer({
  ingredientName,
  children,
}: {
  ingredientName: string;
  /** The substitution lists (SubstitutionLists), rendered inside the sheet. */
  children: ReactNode;
}) {
  return (
    <Drawer side="bottom">
      <div className="mx-4 -mt-1 mb-2 min-[600px]:hidden">
        <DrawerTrigger className="inline-flex h-auto items-center gap-1.5 rounded-full border-0 bg-primary/16 px-3 py-1 text-[0.8125rem] leading-[1.5] text-foreground outline-none hover:bg-primary/30 focus-visible:ring-3 focus-visible:ring-ring/50">
          <ArrowLeftRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Substitutions
        </DrawerTrigger>
      </div>
      <DrawerBackdrop className="bg-black/50" />
      <DrawerContent
        initialFocus="content"
        className="surface gap-0 rounded-t-xl p-0 pb-2 text-foreground backdrop-blur-[8px]"
      >
        <div
          aria-hidden="true"
          data-slot="grip"
          className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/25"
        />
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <DrawerTitle className="text-xl leading-8 font-normal">
            Substitutions
          </DrawerTitle>
          <DrawerClose
            aria-label="Close substitutions"
            className="flex size-9 items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition-colors hover:bg-foreground/8 focus-visible:bg-foreground/16"
          >
            <X className="size-5" aria-hidden="true" />
          </DrawerClose>
        </div>
        <DrawerDescription className="m-0 px-4 pb-3 text-sm text-muted-foreground">
          Bottles and substitution-friendly categories to use in place of {ingredientName}
          .
        </DrawerDescription>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
