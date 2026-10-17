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

function getAttributionHref(attribution: Attribution) {
  return match(attribution)
    .with({ relation: P.union('recipe author', 'adapted by') }, ({ source }) =>
      getAuthorRecipesUrl(source),
    )
    .with({ relation: 'bar' }, ({ source, location }) =>
      getBarRecipesUrl({ name: source, location }),
    )
    .with({ relation: 'book' }, () => undefined)
    .exhaustive();
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
          const href = getAttributionHref(attribution);
          const label = attributionRelationLabels[attribution.relation];
          const location =
            attribution.relation === 'bar' ? attribution.location : undefined;

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
              key={`${attribution.relation}:${attribution.source}`}
              href={href}
              primary={
                href == null && attribution.url ? (
                  <Link href={attribution.url} target="_blank" rel="noopener nofollow">
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
