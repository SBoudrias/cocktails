import Link from 'next/link';
import { Card, CardContent, Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

export default function SearchAllLink({ searchTerm }: { searchTerm: string | null }) {
  if (!searchTerm || searchTerm.trim() === '') {
    return null;
  }

  const searchParams = new URLSearchParams({ search: searchTerm });

  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Link href={`/list/recipes?${searchParams.toString()}`}>
          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            Not finding what you&apos;re looking for? Search all recipes
            <ChevronRight />
          </Typography>
        </Link>
      </CardContent>
    </Card>
  );
}
