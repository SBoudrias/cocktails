import type { SxProps } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { Button, Card, CardContent, Stack } from '@mui/material';

export default function FixBugCard({ fixUrl, sx }: { fixUrl: string; sx?: SxProps }) {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <BugReportIcon />
          <span>Found an error?</span>
          <Button href={fixUrl} target="_blank" rel="noopener nofollow">
            Fix it over here!
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
