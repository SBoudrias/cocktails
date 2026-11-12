import type { MantineSpacing } from '@mantine/core';
import { Button, Card, Group, Text } from '@mantine/core';
import { IconBug } from '@tabler/icons-react';

export default function FixBugCard({
  fixUrl,
  m,
}: {
  fixUrl: string;
  m?: MantineSpacing;
}) {
  return (
    <Card m={m} padding="md">
      <Group gap="xs">
        <IconBug />
        <Text>Found an error?</Text>
        <Button
          component="a"
          href={fixUrl}
          target="_blank"
          rel="noopener nofollow"
          variant="subtle"
        >
          Fix it over here!
        </Button>
      </Group>
    </Card>
  );
}
