import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import YouTubeIcon from '@mui/icons-material/YouTube';
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

export default function YoutubeAboutCard({
  source,
  videoRef,
  sx,
}: {
  source: YoutubeChannel;
  videoRef?: YoutubeRef;
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
      {videoRef && (
        <CardContent>
          <Video id={videoRef.videoId} start={videoRef.start} />
        </CardContent>
      )}
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {source.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'end' }}>
        <Button
          href={source.link}
          target="_blank"
          rel="noreferrer noopener"
          color="inherit"
        >
          Go to channel
          <ArrowOutwardIcon />
        </Button>
      </CardActions>
    </Card>
  );
}
