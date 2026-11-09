import { Box } from '@mui/material';
import Link from 'next/link';
import { getRecipeLetterUrl } from '#/modules/url';

/**
 * Links to every letter page of the recipe list, the current one marked.
 */
export default function LetterNav({
  letters,
  current,
}: {
  letters: { slug: string; label: string }[];
  current: string;
}) {
  return (
    <Box
      component="nav"
      aria-label="Recipes by letter"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mx: 2, my: 1 }}
    >
      {letters.map((letter) => {
        const isCurrent = letter.slug === current;

        return (
          <Link
            key={letter.slug}
            href={getRecipeLetterUrl(letter.slug)}
            aria-current={isCurrent ? 'page' : undefined}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: 32,
                height: 32,
                borderRadius: 1,
                typography: 'button',
                color: isCurrent ? 'primary.contrastText' : 'primary.main',
                bgcolor: isCurrent ? 'primary.main' : 'transparent',
              }}
            >
              {letter.label}
            </Box>
          </Link>
        );
      })}
    </Box>
  );
}
