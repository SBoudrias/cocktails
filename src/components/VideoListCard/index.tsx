import type { SxProps } from '@mui/material';
import { Card, CardContent, CardHeader } from '@mui/material';
import Video from '@/components/Video';
import type { YoutubeRef } from '@/types/Ref';

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
