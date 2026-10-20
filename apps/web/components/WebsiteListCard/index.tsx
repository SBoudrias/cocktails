import type { WebsiteRef } from '@cocktails/data';
import LanguageIcon from '@mui/icons-material/Language';
import type { SxProps } from '@mui/material';
import { Button, Card, CardContent, CardHeader } from '@mui/material';

// Website refs are links to pages about this one cocktail (blog reviews,
// recipe posts); the card names the site and where it goes.
export default function WebsiteListCard({
  refs,
  title = 'Also documented at',
  sx,
}: {
  refs: WebsiteRef[];
  title?: string;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader title={title} />
      <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {refs.map((ref) => (
          <Button
            key={ref.url}
            href={ref.url}
            target="_blank"
            rel="noreferrer noopener"
            color="inherit"
            startIcon={<LanguageIcon />}
            aria-label={ref.url}
          >
            {ref.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
