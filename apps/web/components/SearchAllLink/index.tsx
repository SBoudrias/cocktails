import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '#/components/ui/card';

export default function SearchAllLink({ searchTerm }: { searchTerm: string | null }) {
  if (!searchTerm || searchTerm.trim() === '') {
    return null;
  }

  return (
    <Card className="m-4">
      <CardContent>
        <Link
          href={{ pathname: '/search', query: { search: searchTerm } }}
          className="flex items-center justify-between text-sm text-muted-foreground"
        >
          Not finding what you&apos;re looking for? Search all recipes
          <ChevronRight className="size-6" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
