import type { Book } from '@cocktails/data';
import type { MantineSpacing } from '@mantine/core';
import { Button, Card, Group, Text, Title } from '@mantine/core';
import { IconArrowUpRight, IconBook } from '@tabler/icons-react';

export default function BookAboutCard({
  source,
  chapterName,
  page,
  m,
}: {
  source: Book;
  chapterName?: string;
  page?: number;
  m?: MantineSpacing;
}) {
  const subheader = [chapterName, typeof page === 'number' ? `page ${page}` : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card m={m} padding="md">
      <Group gap="xs">
        <IconBook />
        <Title order={2} size="h3" fw={400}>
          {source.name}
        </Title>
      </Group>
      {subheader && (
        <Text size="sm" c="dimmed">
          {subheader}
        </Text>
      )}
      <Text size="sm" c="dimmed" mt="sm">
        {source.description}
      </Text>
      <Group justify="flex-end" mt="sm">
        <Button
          component="a"
          href={source.link}
          target="_blank"
          rel="noreferrer"
          variant="subtle"
          color="gray"
          rightSection={<IconArrowUpRight size={18} />}
        >
          Learn more
        </Button>
      </Group>
    </Card>
  );
}
