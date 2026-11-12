import type { WebsiteRef } from '@cocktails/data';
import type { MantineSpacing } from '@mantine/core';
import { Button, Card, Group, Title } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';

// Website refs are links to pages about this one cocktail (blog reviews,
// recipe posts); the card names the site and where it goes.
export default function WebsiteListCard({
  refs,
  title = 'Also documented at',
  m,
}: {
  refs: WebsiteRef[];
  title?: string;
  m?: MantineSpacing;
}) {
  return (
    <Card m={m} padding="md">
      <Title order={2} size="h3" fw={400} mb="sm">
        {title}
      </Title>
      <Group gap="xs">
        {refs.map((ref) => (
          <Button
            key={ref.url}
            component="a"
            href={ref.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={ref.url}
            variant="subtle"
            color="gray"
            leftSection={<IconWorld size={18} />}
          >
            {ref.name}
          </Button>
        ))}
      </Group>
    </Card>
  );
}
