import type { WebsiteRef } from '@cocktails/data';
import { Globe } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';

// Website refs are links to pages about this one cocktail (blog reviews,
// recipe posts); the card names the site and where it goes.
export default function WebsiteListCard({
  refs,
  title = 'Also documented at',
  className,
}: {
  refs: WebsiteRef[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {refs.map((ref) => (
          <a
            key={ref.url}
            href={ref.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={ref.url}
            className={buttonVariants({ variant: 'ghost' })}
          >
            <Globe />
            {ref.name}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
