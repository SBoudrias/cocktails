import type { Attribution } from '@cocktails/data';
import { ArrowUpRight } from 'lucide-react';
import { P, match } from 'ts-pattern';
import { List, ListRow, ListSubheader } from '#/components/ui/list';
import { getAuthorRecipesUrl, getBarRecipesUrl } from '#/modules/url';

const attributionRelationLabels = {
  'recipe author': 'created by',
  'adapted by': 'adapted by',
  bar: 'served at',
  book: 'documented by',
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
    <section className="py-2">
      <ListSubheader id="attributions-subheader">Attributions</ListSubheader>
      <List aria-labelledby="attributions-subheader">
        {attributions.map((attribution) => {
          const { key, href, label, location, externalUrl } =
            getAttributionView(attribution);

          const content = (
            <span className="normal-case">
              <span className="text-muted-foreground">{`${label} `}</span>
              {attribution.source}
            </span>
          );

          return (
            <ListRow key={key} href={href}>
              {href == null && externalUrl ? (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {content}
                  <ArrowUpRight className="size-4" />
                </a>
              ) : (
                content
              )}
              {location && (
                <span className="text-xs leading-[1.35] text-muted-foreground">
                  {location}
                </span>
              )}
            </ListRow>
          );
        })}
      </List>
    </section>
  );
}
