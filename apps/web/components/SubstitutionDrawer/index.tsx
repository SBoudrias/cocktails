'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { ReactNode } from 'react';
import ListDrawer from '#/components/ListDrawer';

/**
 * The substitution entry point: a prominent filled action button on its own
 * row right under the page title (below the category chips), opening a
 * bottom sheet that holds the page's substitution lists. Substitutions are a
 * primary piece of ingredient information, so the trigger reads as a button
 * — solid fill, uppercase, full row width — clearly set apart from the
 * translucent category pills beside it, and it shows in every mode: the
 * sheet is the single substitution UI on mobile and desktop alike.
 *
 * The sheet itself (backdrop, handle, title, scrolling body) is the shared
 * ListDrawer chrome, also used by the category pages' bottle list.
 */
export default function SubstitutionDrawer({
  ingredientName,
  children,
}: {
  ingredientName: string;
  /** The substitution lists (SubstitutionLists), rendered inside the sheet. */
  children: ReactNode;
}) {
  return (
    <div className="mx-4 mb-2">
      <ListDrawer
        title="Substitutions"
        description={`Bottles and substitution-friendly categories to use in place of ${ingredientName}.`}
        closeLabel="Close substitutions"
        trigger={
          <>
            <ArrowLeftRight className="size-5" aria-hidden="true" />
            Substitutions
          </>
        }
        triggerClassName="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium tracking-wide text-primary-foreground uppercase transition-colors outline-none hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </ListDrawer>
    </div>
  );
}
