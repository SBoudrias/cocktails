import type { CategorizationSystem } from '@cocktails/data';
import { getCategory } from '@cocktails/data/categories';
import { getCategorizationSystems } from '@cocktails/data/categorization-systems';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import AppHeader from '#/components/AppHeader';
import { LinkList, LinkListItem } from '#/components/list/LinkList';
import { Card, CardContent } from '#/components/ui/card';
import { getCategoryUrl } from '#/modules/url';

type Params = { slug: string };

/**
 * The nodes of one categorization system with their member counts, ordered
 * by how many bottles each node holds — the styles users actually browse
 * first.
 */
async function getNodesWithCounts(system: CategorizationSystem) {
  const nodes = await Promise.all(
    system.nodes.map(async (node) => {
      const category = await getCategory(node.slug);
      const members = await getIngredientsForCategory(category);

      return { node, count: members.length };
    }),
  );

  return nodes.toSorted((a, b) => b.count - a.count);
}

export async function generateStaticParams(): Promise<Params[]> {
  const systems = await getCategorizationSystems();

  return systems.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const system = (await getCategorizationSystems()).find((s) => s.slug === slug);
    if (!system) notFound();

    return {
      title: `Indexotica | ${system.name} categories`,
      description: system.description,
    };
  } catch (error) {
    unstable_rethrow(error);
    notFound();
  }
}

export default async function CategorizationSystemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const system = (await getCategorizationSystems()).find((s) => s.slug === slug);
  if (!system) notFound();

  const nodes = await getNodesWithCounts(system);

  return (
    <>
      <AppHeader title={system.name} />
      {system.description && (
        <Card m={1}>
          <CardContent>
            <p>{system.description}</p>
          </CardContent>
        </Card>
      )}
      <LinkList
        header={`${system.name} categories`}
        items={nodes}
        renderItem={({ node, count }) => (
          <LinkListItem
            key={node.slug}
            href={getCategoryUrl(node)}
            primary={node.name}
            count={count}
          />
        )}
      />
    </>
  );
}
