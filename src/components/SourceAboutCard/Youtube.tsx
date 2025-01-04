import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography,
  type SxProps,
} from '@mui/material';
import Video from '@/components/Video';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { YoutubeRef } from '@/types/Ref';
import { YoutubeChannel } from '@/types/Source';

export default function YoutubeAboutCard({
  source,
  ref,
  sx,
}: {
  source: YoutubeChannel;
  ref?: YoutubeRef;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <YouTubeIcon />
            &nbsp;{source.name}
          </>
        }
      />
      <CardContent>
        {ref && <Video id={ref.videoId} start={ref.start} />}
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: ref ? 1 : 0 }}>
          {source.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'end' }}>
        <Button href={source.link} target="_blank" rel="noreferrer" color="inherit">
          View on Youtube
          <ArrowOutwardIcon />
        </Button>
      </CardActions>
    </Card>
  );
}
