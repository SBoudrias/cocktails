import type { Attribution } from '@cocktails/data';
import { Anchor, Text } from '@mantine/core';
import { IconArrowUpRight } from '@tabler/icons-react';
import { P, match } from 'ts-pattern';
import { List, ListRow, ListSubheader } from '#/components/AppList';
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
    <section>
      <ListSubheader id="attributions-subheader">Attributions</ListSubheader>
      <List aria-labelledby="attributions-subheader">
        {attributions.map((attribution) => {
          const { key, href, label, location, externalUrl } =
            getAttributionView(attribution);

          const content = (
            <Text component="span">
              <Text component="span" c="dimmed">
                {`${label} `}
              </Text>
              {attribution.source}
            </Text>
          );

          return (
            <ListRow key={key} href={href}>
              {href == null && externalUrl ? (
                <Anchor href={externalUrl} target="_blank" rel="noopener nofollow">
                  {content}
                  <IconArrowUpRight size={16} />
                </Anchor>
              ) : (
                content
              )}
              {location && (
                <Text size="xs" c="dimmed" lh={1.35}>
                  {location}
                </Text>
              )}
            </ListRow>
          );
        })}
      </List>
    </section>
  );
}
