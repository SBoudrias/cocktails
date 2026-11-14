import type { Category } from '@cocktails/data';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Link, Stack } from '@mui/material';
import { getCategoryUrl } from '#/modules/url';

/**
 * An ingredient's category membership, as pill chips right under the page
 * title — every category it belongs to, each linking to its category page.
 */
export default function CategoryChips({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <Stack
      role="group"
      aria-label="Categories"
      direction="row"
      spacing={0.75}
      sx={{
        flexWrap: 'wrap',
        alignItems: 'center',
        rowGap: 0.75,
        mx: 2,
        mt: -0.5,
        mb: 1,
      }}
    >
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={getCategoryUrl(category)}
          underline="none"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            borderRadius: 999,
            backgroundColor: 'rgba(42, 138, 138, 0.16)',
            color: 'text.primary',
            fontSize: '0.8125rem',
            '&:hover': {
              backgroundColor: 'rgba(42, 138, 138, 0.3)',
            },
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          {category.name}
        </Link>
      ))}
    </Stack>
  );
}
