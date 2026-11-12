import type { Podcast } from '@cocktails/data';
import type { MantineSpacing } from '@mantine/core';
import { Button, Card, Group, Text, Title } from '@mantine/core';
import { IconArrowUpRight, IconMicrophone } from '@tabler/icons-react';

export default function PodcastAboutCard({
  source,
  episodeTitle,
  episodeLink,
  m,
}: {
  source: Podcast;
  episodeTitle?: string;
  episodeLink?: string;
  m?: MantineSpacing;
}) {
  return (
    <Card m={m} padding="md">
      <Group gap="xs">
        <IconMicrophone />
        <Title order={2} size="h3" fw={400}>
          {source.name}
        </Title>
      </Group>
      {episodeTitle && (
        <Text size="sm" c="dimmed">
          Episode: {episodeTitle}
        </Text>
      )}
      <Text size="sm" c="dimmed" mt="sm">
        {source.description}
      </Text>
      <Group justify="flex-end" mt="sm">
        <Button
          component="a"
          href={episodeLink || source.link}
          target="_blank"
          rel="noreferrer noopener"
          variant="subtle"
          color="gray"
          rightSection={<IconArrowUpRight size={18} />}
        >
          {episodeLink ? 'Listen to episode' : 'Listen to podcast'}
        </Button>
      </Group>
    </Card>
  );
}
