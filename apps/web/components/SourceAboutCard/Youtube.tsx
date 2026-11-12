import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import type { MantineSpacing } from '@mantine/core';
import { Button, Card, Group, Text, Title } from '@mantine/core';
import { IconArrowUpRight, IconBrandYoutubeFilled } from '@tabler/icons-react';
import Video from '#/components/Video';

export default function YoutubeAboutCard({
  source,
  videoRef,
  m,
}: {
  source: YoutubeChannel;
  videoRef?: YoutubeRef;
  m?: MantineSpacing;
}) {
  return (
    <Card m={m} padding="md">
      <Group gap="xs" mb="sm">
        <IconBrandYoutubeFilled />
        <Title order={2} size="h3" fw={400}>
          {source.name}
        </Title>
      </Group>
      {videoRef && <Video id={videoRef.videoId} start={videoRef.start} />}
      <Text size="sm" c="dimmed" mt="sm">
        {source.description}
      </Text>
      <Group justify="flex-end" mt="sm">
        <Button
          component="a"
          href={source.links[0]}
          target="_blank"
          rel="noreferrer noopener"
          variant="subtle"
          color="gray"
          rightSection={<IconArrowUpRight size={18} />}
        >
          Go to channel
        </Button>
      </Group>
    </Card>
  );
}
