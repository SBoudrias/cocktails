import { Card, CardContent, CardHeader, SxProps } from '@mui/material';
import Video from '@/components/Video';
import { YoutubeRef } from '@/types/Ref';

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
