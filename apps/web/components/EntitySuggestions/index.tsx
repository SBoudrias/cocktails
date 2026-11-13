import {
  Liquor as LiquorIcon,
  LocalBar as LocalBarIcon,
  LocalOffer as LocalOfferIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Podcasts as PodcastsIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { Box, List, Paper } from '@mui/material';
import { match } from 'ts-pattern';
import { LinkListItem } from '#/components/LinkList';
import type { EntitySuggestion } from '#/modules/entitySuggestions';
import { isEntityUrl } from '#/modules/url';

function getEntityView(kind: EntitySuggestion['kind']) {
  // Icon-only in the visible row; the label rides on the icon for screen
  // readers (SvgIcon renders role="img" with its aria-label). Categories use
  // the tag the ingredient pages and CategoryName render for categories.
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
    <List aria-label="Matching entities" sx={{ pb: 2 }}>
      <Paper square>
        {links.map((suggestion) => {
          const { icon } = getEntityView(suggestion.kind);

          return (
            <LinkListItem
              key={suggestion.href}
              href={suggestion.href}
              primary={
                // Inline flex centers the icon's box on the text's line
                // instead of sitting it on the baseline like a bare SvgIcon.
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                >
                  {icon}
                  {suggestion.name}
                </Box>
              }
            />
          );
        })}
      </Paper>
    </List>
  );
}
