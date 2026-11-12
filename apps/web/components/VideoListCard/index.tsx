import type { YoutubeRef } from '@cocktails/data';
import type { MantineSpacing } from '@mantine/core';
import { Card, Stack, Title } from '@mantine/core';
import Video from '#/components/Video';

export default function VideoListCard({
  refs,
  title = 'Video',
  m,
}: {
  refs: YoutubeRef[];
  title?: string;
  m?: MantineSpacing;
}) {
  return (
    <Card m={m} padding="md">
      <Title order={2} size="h3" fw={400} mb="sm">
        {title}
      </Title>
      <Stack gap="md">
        {refs.map((ref) => (
          <Video key={ref.videoId} id={ref.videoId} start={ref.start} />
        ))}
      </Stack>
    </Card>
  );
}
