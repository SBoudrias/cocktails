'use client';

import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from '@ui-sdk/react/drawer';
import { ChevronDown, X } from 'lucide-react';
import type { ReactNode } from 'react';
import './drawer.css';

/**
 * The shared bottom-sheet chrome: a caller-styled trigger opening the sheet
 * that holds a page's list content — the substitution lists on ingredient
 * pages, the member bottles on category pages. The trigger's look is the
 * caller's (a prominent button under the ingredient title, a quiet see-all
 * row inside a category's preview): only the sheet — backdrop, resize
 * handle, title row, description, scrolling body — lives here, so both
 * pages share one drawer behavior (snap points, desktop centering, the
 * sheet covering the app bar).
 */
export default function ListDrawer({
  title,
  description,
  closeLabel = `Close ${title.toLowerCase()}`,
  trigger,
  triggerClassName,
  keepContentMounted = false,
  children,
}: {
  /** The sheet's title. */
  title: string;
  /** The sheet's description line, under the title. */
  description: string;
  /** The close button's accessible label. */
  closeLabel?: string;
  /** The trigger button's content (label, icons). */
  trigger: ReactNode;
  /** The trigger button's classes — sized and styled by the caller. */
  triggerClassName: string;
  /** Keep the sheet's content in the DOM while closed: the list's links
   * stay in the static export (crawlable), at the cost of shipping them
   * in every page's HTML. */
  keepContentMounted?: boolean;
  /** The list content, rendered inside the sheet's scrolling body. */
  children: ReactNode;
}) {
  return (
    <Drawer side="bottom" snapPoints={[0.5, 1]}>
      <DrawerTrigger className={triggerClassName}>
        {trigger}
        <ChevronDown className="size-4 opacity-80" aria-hidden="true" />
      </DrawerTrigger>
      <DrawerBackdrop className="bg-black/50" />
      <DrawerContent
        keepMounted={keepContentMounted}
        initialFocus="content"
        className="gap-0 rounded-t-xl surface p-0 pb-2 text-foreground backdrop-blur-[8px]"
      >
        <DrawerHandle
          aria-label="Resize sheet"
          className="flex w-full items-center justify-center border-0 bg-transparent py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            data-slot="grip"
            className="h-1 w-10 rounded-full bg-foreground/25"
          />
        </DrawerHandle>
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <DrawerTitle className="text-xl leading-8 font-normal">{title}</DrawerTitle>
          <DrawerClose
            aria-label={closeLabel}
            className="flex size-9 items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors outline-none hover:bg-foreground/8 focus-visible:bg-foreground/16"
          >
            <X className="size-5" aria-hidden="true" />
          </DrawerClose>
        </div>
        <DrawerDescription className="m-0 px-4 pb-3 text-sm text-muted-foreground">
          {description}
        </DrawerDescription>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
