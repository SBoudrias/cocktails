import { Bug } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import { Card, CardContent } from '#/components/ui/card';

export default function FixBugCard({
  fixUrl,
  className,
}: {
  fixUrl: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-2 text-base">
        <Bug className="size-6" />
        <span>Found an error?</span>
        <a
          href={fixUrl}
          target="_blank"
          rel="noopener nofollow"
          className={buttonVariants({ variant: 'link' })}
        >
          Fix it over here!
        </a>
      </CardContent>
    </Card>
  );
}
