import { BookOpen, Martini, Mic, Tag, User, Wine } from 'lucide-react';
import { match } from 'ts-pattern';
import YoutubeIcon from '#/components/icons/YoutubeIcon';
import { LinkListItem } from '#/components/LinkList';
import type { EntitySuggestion } from '#/modules/entitySuggestions';
import { isEntityUrl } from '#/modules/url';
import styles from './style.module.css';

function getEntityView(kind: EntitySuggestion['kind']) {
  // Icon-only in the visible row; the label rides on the icon for screen
  // readers. Categories use the tag the ingredient pages and CategoryName
  // render for categories.
  return match(kind)
    .returnType<{ icon: React.ReactNode }>()
    .with('category', () => ({
      icon: <Tag aria-label="Category" className="size-6" />,
    }))
    .with('ingredient', () => ({
      icon: <Wine aria-label="Ingredient" className="size-6" />,
    }))
    .with('author', () => ({
      icon: <User aria-label="Author" className="size-6" />,
    }))
    .with('bar', () => ({
      icon: <Martini aria-label="Bar" className="size-6" />,
    }))
    .with('book', () => ({
      icon: <BookOpen aria-label="Book" className="size-6" />,
    }))
    .with('youtube-channel', () => ({
      icon: <YoutubeIcon />,
    }))
    .with('podcast', () => ({
      icon: <Mic aria-label="Podcast" className="size-6" />,
    }))
    .exhaustive();
}

/**
 * The entities strongly matching the search term, above the recipe results.
 * No visible subheader: the icon-led rows set the section apart, an
 * aria-label keeps the list addressable for screen readers, and the bottom
 * padding separates it from the recipe results below.
 */
export default function EntitySuggestions({
  suggestions,
}: {
  suggestions: EntitySuggestion[];
}) {
  // The index is built from the entity pages, so every href narrows here —
  // the guard keeps a stale or malformed index from rendering dead links.
  const links = suggestions.flatMap((suggestion) =>
    isEntityUrl(suggestion.href) ? [{ ...suggestion, href: suggestion.href }] : [],
  );

  if (links.length === 0) return null;

  return (
    <ul aria-label="Matching entities" className="pt-2 pb-4">
      <div className="bg-card">
        {links.map((suggestion) => {
          const { icon } = getEntityView(suggestion.kind);

          return (
            <LinkListItem
              key={suggestion.href}
              href={suggestion.href}
              primary={
                // Inline flex centers the icon's box on the text's line
                // instead of sitting it on the baseline like a bare svg.
                <span className="inline-flex items-center gap-1">
                  {icon}
                  <span className={styles.name}>{suggestion.name}</span>
                </span>
              }
            />
          );
        })}
      </div>
    </ul>
  );
}
