import { ChevronRight } from '@mui/icons-material';
import { Card, CardContent, Typography } from '@mui/material';
import Link from 'next/link';

export default function SearchAllLink({ searchTerm }: { searchTerm: string | null }) {
  if (!searchTerm || searchTerm.trim() === '') {
    return null;
  }

  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Link href={{ pathname: '/search', query: { search: searchTerm } }}>
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
