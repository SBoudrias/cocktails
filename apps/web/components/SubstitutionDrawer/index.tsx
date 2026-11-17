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
import { ArrowLeftRight, ChevronDown, X } from 'lucide-react';
import type { ReactNode } from 'react';
import './drawer.css';

// The substitution entry point: a prominent filled action button on its own
// row right under the page title (below the category chips), opening a
// bottom sheet that holds the page's substitution lists. Substitutions are a
// primary piece of ingredient information, so the trigger reads as a button
// — solid fill, uppercase, full row width — clearly set apart from the
// translucent category pills beside it, and it shows in every mode: the
// sheet is the single substitution UI on mobile and desktop alike.
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
      <div className="mx-4 mb-2">
        <DrawerTrigger className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium tracking-wide text-primary-foreground uppercase outline-none transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50">
          <ArrowLeftRight className="size-5" aria-hidden="true" />
          Substitutions
          <ChevronDown className="size-4 opacity-80" aria-hidden="true" />
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
