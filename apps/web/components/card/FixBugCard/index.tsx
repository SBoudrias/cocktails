import { Bug } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import { Card, CardContent, type CardMargin } from '#/components/ui/card';

export default function FixBugCard({ fixUrl, m }: { fixUrl: string; m?: CardMargin }) {
  return (
    <Card m={m}>
      <CardContent className="flex items-center justify-center gap-2 text-base">
        <Bug className="size-6 shrink-0" aria-hidden="true" />
        <span>Found an error?</span>
        <a
          href={fixUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={buttonVariants({ variant: 'text' })}
        >
          Fix it over here!
        </a>
      </CardContent>
    </Card>
  );
}
