import type { Author, Bar, Source } from '@cocktails/data';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Link,
  Typography,
  type SxProps,
} from '@mui/material';
import { getBarRecipesUrl, getSourceUrl } from '#/modules/url';

function getHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

function LinkButtons({ links }: { links?: [string, ...string[]] }) {
  if (!links) return null;

  return links.map((link) => (
    <Button
      key={link}
      href={link}
      target="_blank"
      rel="noreferrer noopener"
      color="inherit"
    >
      {getHostname(link)}
      <ArrowOutwardIcon />
    </Button>
  ));
}

/**
 * About card for an author entity. Renders nothing until the entity file has
 * a verified link or description — most authors are a name only.
 */
export function AuthorAboutCard({
  author,
  bars,
  sources,
  sx,
}: {
  author: Author | undefined;
  bars: Bar[];
  sources: Source[];
  sx?: SxProps;
}) {
  if (
    !author ||
    (!author.links && !author.description && bars.length === 0 && sources.length === 0)
  ) {
    return null;
  }

  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <PersonIcon />
            &nbsp;{author.name}
          </>
        }
      />
      {author.description && (
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {author.description}
          </Typography>
        </CardContent>
      )}
      {(bars.length > 0 || sources.length > 0) && (
        <CardContent>
          {bars.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Worked at{' '}
              {bars.map((bar, index) => (
                <span key={bar.slug}>
                  {index > 0 && ' · '}
                  <Link href={getBarRecipesUrl(bar)}>{bar.name}</Link>
                </span>
              ))}
            </Typography>
          )}
          {sources.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: bars.length > 0 ? 0.5 : 0 }}
            >
              Behind{' '}
              {sources.map((source, index) => (
                <span key={`${source.type}:${source.slug}`}>
                  {index > 0 && ' · '}
                  <Link href={getSourceUrl(source)}>{source.name}</Link>
                </span>
              ))}
            </Typography>
          )}
        </CardContent>
      )}
      <CardActions sx={{ justifyContent: 'end' }}>
        <LinkButtons links={author.links} />
      </CardActions>
    </Card>
  );
}

/**
 * About card for a bar entity. The map link is derived from name and location
 * at render time — never stored. Renders nothing until the entity file has
 * a location, verified link, or description.
 */
export function BarAboutCard({ bar, sx }: { bar: Bar | undefined; sx?: SxProps }) {
  if (!bar || (!bar.links && !bar.description && !bar.location)) return null;

  const mapUrl = bar.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bar.name} ${bar.location}`)}`
    : undefined;

  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <LocalBarIcon />
            &nbsp;{bar.name}
          </>
        }
        subheader={bar.location}
      />
      {bar.description && (
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {bar.description}
          </Typography>
        </CardContent>
      )}
      <CardActions sx={{ justifyContent: 'end' }}>
        <LinkButtons links={bar.links} />
        {mapUrl && (
          <Button href={mapUrl} target="_blank" rel="noreferrer noopener" color="inherit">
            Map
            <MapIcon />
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
