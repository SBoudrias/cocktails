import type { Author, Bar } from '@cocktails/data';
import { cn } from 'cn';
import { Globe, Map as MapIcon, Martini, User } from 'lucide-react';
import { siFacebook, siInstagram, siX, siYoutube } from 'simple-icons';
import { match, P } from 'ts-pattern';
import BrandIcon from '#/components/icons/BrandIcon';
import { buttonVariants } from '#/components/ui/button-variants';
import type { CardMargin } from '#/components/ui/card';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardSubheader,
  CardTitle,
} from '#/components/ui/card';
import { getBarRecipesUrl, getSourceUrl } from '#/modules/url';

function getHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

// Social links show their brand mark plus the handle from the url path
// (@erynreece reads better than instagram.com); every other link shows a
// globe and its domain. The button's aria-label carries the full url. The
// marks render at 20px, MUI's startIcon glyph size.
function getLinkView(url: string) {
  return match(getHostname(url))
    .returnType<{ icon: React.ReactNode; label: string }>()
    .with('instagram.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return {
        icon: <BrandIcon icon={siInstagram} className="-ml-1 mr-2" />,
        label: handle ? handle : host,
      };
    })
    .with('youtube.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return handle
        ? { icon: <BrandIcon icon={siYoutube} className="-ml-1 mr-2" />, label: handle }
        : { icon: <BrandIcon icon={siYoutube} className="-ml-1 mr-2" />, label: host };
    })
    .with(P.union('x.com', 'twitter.com'), (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return {
        icon: <BrandIcon icon={siX} className="-ml-1 mr-2" />,
        label: handle ? handle : host,
      };
    })
    .with('facebook.com', (host) => {
      const handle = new URL(url).pathname.replace('/', '').split('/')[0];
      return {
        icon: <BrandIcon icon={siFacebook} className="-ml-1 mr-2" />,
        label: handle ? handle : host,
      };
    })
    .otherwise((host) => ({ icon: <Globe className="-ml-1 mr-2" />, label: host }));
}

function LinkButtons({ links }: { links?: [string, ...string[]] }) {
  if (!links) return null;

  return links.map((link) => {
    const { icon, label } = getLinkView(link);

    return (
      <a
        key={link}
        href={link}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={link}
        className={buttonVariants({ variant: 'text-inherit' })}
      >
        {icon}
        {label}
      </a>
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
  m,
}: {
  author: Author | undefined;
  m?: CardMargin;
}) {
  if (!author) return null;

  const bars = author.bars ?? [];
  const sources = author.sources ?? [];

  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>
          <User
            className="mr-1.5 inline-block size-6 align-text-top"
            aria-hidden="true"
          />
          {author.name}
        </CardTitle>
      </CardHeader>
      {author.description && (
        <CardContent>
          <p className="text-muted-foreground">{author.description}</p>
        </CardContent>
      )}
      {(bars.length > 0 || sources.length > 0) && (
        <CardContent>
          {bars.length > 0 && (
            <p className="text-muted-foreground">
              Known for their work at{' '}
              {bars.map((bar, index) => (
                <span key={bar.slug}>
                  {index > 0 && ' · '}
                  <a
                    className="text-primary underline decoration-primary/40"
                    href={getBarRecipesUrl(bar)}
                  >
                    {bar.name}
                  </a>
                </span>
              ))}
            </p>
          )}
          {sources.length > 0 && (
            <p className={cn('text-muted-foreground', bars.length > 0 && 'mt-0.5')}>
              Behind{' '}
              {sources.map((source, index) => (
                <span key={`${source.type}:${source.slug}`}>
                  {index > 0 && ' · '}
                  <a
                    className="text-primary underline decoration-primary/40"
                    href={getSourceUrl(source)}
                  >
                    {source.name}
                  </a>
                </span>
              ))}
            </p>
          )}
        </CardContent>
      )}
      <CardActions>
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
export function BarAboutCard({ bar, m }: { bar: Bar | undefined; m?: CardMargin }) {
  if (!bar) return null;

  const mapUrl = bar.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bar.name} ${bar.location}`)}`
    : undefined;

  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>
          <Martini
            className="mr-1.5 inline-block size-6 align-text-top"
            aria-hidden="true"
          />
          {bar.name}
        </CardTitle>
        {bar.location && <CardSubheader>{bar.location}</CardSubheader>}
      </CardHeader>
      {bar.description && (
        <CardContent>
          <p className="text-muted-foreground">{bar.description}</p>
        </CardContent>
      )}
      <CardActions>
        <LinkButtons links={bar.links} />
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: 'text-inherit' })}
          >
            Map
            <MapIcon className="-mr-1 ml-2 size-6" aria-hidden="true" />
          </a>
        )}
      </CardActions>
    </Card>
  );
}
