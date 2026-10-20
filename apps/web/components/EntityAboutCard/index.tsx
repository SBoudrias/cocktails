import type { Author, Bar } from '@cocktails/data';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
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
import { match, P } from 'ts-pattern';
import { getBarRecipesUrl, getSourceUrl } from '#/modules/url';

function getHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

// Social links show their brand mark plus the handle from the url path
// (@erynreece reads better than instagram.com); every other link shows a
// globe and its domain. The button's aria-label carries the full url.
function getLinkView(url: string) {
  return match(getHostname(url))
    .returnType<{ icon: React.ReactNode; label: string }>()
    .with('instagram.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return { icon: <InstagramIcon />, label: handle ? `@${handle}` : host };
    })
    .with('youtube.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return handle
        ? { icon: <YouTubeIcon />, label: handle }
        : { icon: <YouTubeIcon />, label: host };
    })
    .with(P.union('x.com', 'twitter.com'), (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return { icon: <XIcon />, label: handle ? `@${handle}` : host };
    })
    .with('facebook.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return { icon: <FacebookIcon />, label: handle ? handle : host };
    })
    .otherwise((host) => ({ icon: <LanguageIcon />, label: host }));
}

function LinkButtons({ links }: { links?: [string, ...string[]] }) {
  if (!links) return null;

  return links.map((link) => {
    const { icon, label } = getLinkView(link);

    return (
      <Button
        key={link}
        href={link}
        target="_blank"
        rel="noreferrer noopener"
        color="inherit"
        aria-label={link}
      >
        {icon}
        {label}
      </Button>
    );
  });
}

/**
 * About card for an author entity. The card header (the author's name) always
 * renders — it is the page's title, shown once; description, known-for bars,
 * sources, and links appear only when the entity has them.
 */
export function AuthorAboutCard({
  author,
  sx,
}: {
  author: Author | undefined;
  sx?: SxProps;
}) {
  if (!author) return null;

  const bars = author.bars ?? [];
  const sources = author.sources ?? [];

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
              Known for their work at{' '}
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
 * at render time — never stored. The card header (the bar's name) always
 * renders — it is the page's title, shown once; location, description, and
 * links appear only when the entity has them.
 */
export function BarAboutCard({ bar, sx }: { bar: Bar | undefined; sx?: SxProps }) {
  if (!bar) return null;

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
