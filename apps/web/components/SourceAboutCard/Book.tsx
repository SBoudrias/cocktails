import type { Book } from '@cocktails/data';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
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
        <CardTitle className="flex items-center gap-2 text-2xl font-normal">
          <BookOpen className="size-6" />
          {source.name}
        </CardTitle>
        {subheader && <CardDescription>{subheader}</CardDescription>}
      </CardHeader>
      <CardContent className="text-muted-foreground">{source.description}</CardContent>
      <CardFooter className="justify-end border-0 bg-transparent px-2 pt-0 pb-2">
        <a
          href={source.link}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'ghost' })}
        >
          About the book
          <ArrowUpRight />
        </a>
      </CardFooter>
    </Card>
  );
}
