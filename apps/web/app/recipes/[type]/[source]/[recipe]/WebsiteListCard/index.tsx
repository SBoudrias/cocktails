import type { WebsiteRef } from '@cocktails/data';
import { Globe } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardMargin,
} from '#/components/ui/card';

// Website refs are links to pages about this one cocktail (blog reviews,
// recipe posts); the card names the site and where it goes.
export default function WebsiteListCard({
  refs,
  title = 'Also documented at',
  m,
}: {
  refs: WebsiteRef[];
  title?: string;
  m?: CardMargin;
}) {
  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1">
        {refs.map((ref) => (
          <a
            key={ref.url}
            href={ref.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={ref.url}
            className={buttonVariants({ variant: 'text-inherit' })}
          >
            <Globe aria-hidden="true" />
            {ref.name}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
