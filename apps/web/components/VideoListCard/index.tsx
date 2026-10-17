import type { YoutubeRef } from '@cocktails/data';
import type { SxProps } from '@mui/material';
import { Box, Card, CardContent, CardHeader } from '@mui/material';
import Video from '#/components/Video';

export default function VideoListCard({
  refs,
  title,
  sx,
}: {
  refs: YoutubeRef[];
  title?: string;
  sx?: SxProps;
}) {
  const galleryTitle = title ?? (refs.length > 1 ? 'Videos' : 'Video');

  return (
    <Card sx={sx}>
      <CardHeader title={galleryTitle} />
      <Box
        component="ul"
        aria-label={galleryTitle}
        sx={{
          listStyle: 'none',
          m: 0,
          p: { xs: 0, md: 2 },
          pt: { md: 0 },
          display: { md: 'grid' },
          gridTemplateColumns: {
            md: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          },
          gap: 2,
        }}
      >
        {refs.map((ref) => (
          <CardContent
            component="li"
            key={ref.videoId}
            sx={{ pt: 0, p: { md: 0 }, ':last-child': { pb: { md: 0 } } }}
          >
            <Video id={ref.videoId} start={ref.start} />
          </CardContent>
        ))}
      </Box>
    </Card>
  );
}
