import type { Attribution } from '@cocktails/data';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { Link, List, ListSubheader, Paper, Typography } from '@mui/material';
import { P, match } from 'ts-pattern';
import { LinkListItem } from '#/components/LinkList';
import { getAuthorRecipesUrl, getBarRecipesUrl } from '#/modules/url';

const attributionRelationLabels = {
  'recipe author': 'created by',
  'adapted by': 'adapted by',
  bar: 'served at',
  book: 'documented by',
} as const;

const secondaryTypographyProps = {
  variant: 'caption',
  sx: { lineHeight: 1.35 },
} as const;

function getAttributionView(attribution: Attribution) {
  return (
    match(attribution)
      .with(
        { relation: P.union('recipe author', 'adapted by') },
        ({ relation, source }) => ({
          key: `${relation}:${source}`,
          href: getAuthorRecipesUrl(source),
          label: attributionRelationLabels[relation],
          location: undefined,
          externalUrl: undefined,
        }),
      )
      .with({ relation: 'bar' }, ({ relation, source, location }) => ({
        key: `${relation}:${source}`,
        href: getBarRecipesUrl({ name: source, location }),
        label: attributionRelationLabels[relation],
        location,
        externalUrl: undefined,
      }))
      // Only book attributions keep an external url — author and bar urls
      // live on the entity files and their list pages.
      .with({ relation: 'book' }, ({ relation, source, url }) => ({
        key: `${relation}:${source}`,
        href: undefined,
        label: attributionRelationLabels[relation],
        location: undefined,
        externalUrl: url,
      }))
      .exhaustive()
  );
}

export default function RecipeAttributionList({
  attributions,
}: {
  attributions: Attribution[];
}) {
  return (
    <List>
      <ListSubheader>Attributions</ListSubheader>
      <Paper square>
        {attributions.map((attribution) => {
          const { key, href, label, location, externalUrl } =
            getAttributionView(attribution);

          const content = (
            <Typography component="span" sx={{ textTransform: 'none' }}>
              <Typography component="span" color="textSecondary">
                {`${label} `}
              </Typography>
              {attribution.source}
            </Typography>
          );

          return (
            <LinkListItem
              key={key}
              href={href}
              primary={
                href == null && externalUrl ? (
                  <Link href={externalUrl} target="_blank" rel="noopener nofollow">
                    {content}
                    <ArrowOutwardIcon sx={{ fontSize: 'medium' }} />
                  </Link>
                ) : (
                  content
                )
              }
              secondary={location}
              secondaryTypographyProps={secondaryTypographyProps}
            />
          );
        })}
      </Paper>
    </List>
  );
}
