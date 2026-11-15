import type { Category } from '@cocktails/data';
import { cn } from 'cn';
import { Tag } from 'lucide-react';
import Link from 'next/link';
import { getCategoryUrl } from '#/modules/url';

/**
 * Category membership as pill chips right under the page title — every
 * category passed in, each linking to its category page. Ingredient pages
 * list the ingredient's categories; category pages list its parents.
 */
export default function CategoryChips({
  categories,
  label = 'Categories',
}: {
  categories: Category[];
  /** Accessible name of the chips group. */
  label?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className="mx-2 -mt-0.5 mb-2 flex flex-wrap items-center gap-x-3 gap-y-3"
    >
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={getCategoryUrl(category)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full bg-primary/16 px-2 text-[0.8125rem] text-foreground',
            'hover:bg-primary/30',
          )}
        >
          <Tag className="size-3.5 text-muted-foreground" />
          {category.name}
        </Link>
      ))}
    </div>
  );
}
