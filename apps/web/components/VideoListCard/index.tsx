import type { YoutubeRef } from '@cocktails/data';
import type { SxProps } from '@mui/material';
import Video from '#/components/Video';
import { Card, CardContent, CardHeader } from '@mui/material';

export default function VideoListCard({
  refs,
  title = 'Video',
  sx,
}: {
  refs: YoutubeRef[];
  title?: string;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader title={title} />
      {refs.map((ref) => (
        <CardContent key={ref.videoId}>
          <Video id={ref.videoId} start={ref.start} />
        </CardContent>
      ))}
    </Card>
  );
}
