import {
  Liquor as LiquorIcon,
  LocalBar as LocalBarIcon,
  LocalOffer as LocalOfferIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Podcasts as PodcastsIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { Box } from '@mui/material';
import { match } from 'ts-pattern';
import { LinkList, LinkListItem } from '#/components/LinkList';
import type { EntitySuggestion } from '#/modules/entitySuggestions';
import { isEntityUrl } from '#/modules/url';

function getEntityView(kind: EntitySuggestion['kind']) {
  // Icon-only in the visible row; the label rides on the icon for screen
  // readers (SvgIcon renders role="img" with its aria-label).
  return match(kind)
    .returnType<{ icon: React.ReactNode }>()
    .with('category', () => ({ icon: <LocalOfferIcon aria-label="Category" /> }))
    .with('ingredient', () => ({ icon: <LiquorIcon aria-label="Ingredient" /> }))
    .with('author', () => ({ icon: <PersonIcon aria-label="Author" /> }))
    .with('bar', () => ({ icon: <LocalBarIcon aria-label="Bar" /> }))
    .with('book', () => ({ icon: <MenuBookIcon aria-label="Book" /> }))
    .with('youtube-channel', () => ({
      icon: <YouTubeIcon aria-label="YouTube channel" />,
    }))
    .with('podcast', () => ({ icon: <PodcastsIcon aria-label="Podcast" /> }))
    .exhaustive();
}

/**
 * The entities strongly matching the search term, above the recipe results:
 * each row leads with its kind's icon, so it never reads as a recipe. The
 * list header separates the section from the recipes below.
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
    <Box sx={{ pb: 2 }}>
      <LinkList
        header="Matching entities"
        items={links}
        renderItem={(suggestion) => {
          const { icon } = getEntityView(suggestion.kind);

          return (
            <LinkListItem
              key={suggestion.href}
              href={suggestion.href}
              primary={
                <>
                  {icon}
                  &nbsp;{suggestion.name}
                </>
              }
            />
          );
        }}
      />
    </Box>
  );
}
