import type { Book } from '@cocktails/data';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardSubheader,
  CardTitle,
} from '#/components/ui/card';

export default function BookAboutCard({
  source,
  chapterName,
  page,
  className,
}: {
  source: Book;
  chapterName?: string;
  page?: number;
  className?: string;
}) {
  const subheader = [chapterName, typeof page === 'number' ? `page ${page}` : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <BookOpen className="mr-1 inline size-6 align-text-bottom" aria-hidden="true" />
          {source.name}
        </CardTitle>
        {subheader && <CardSubheader>{subheader}</CardSubheader>}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{source.description}</p>
      </CardContent>
      <CardActions>
        <a
          href={source.link}
          target="_blank"
          rel="noreferrer"
          aria-label="Learn more about this book"
          className={buttonVariants({ variant: 'text-inherit' })}
        >
          Learn more
          <ArrowUpRight className="-mr-1 ml-2 size-6" aria-hidden="true" />
        </a>
      </CardActions>
    </Card>
  );
}
