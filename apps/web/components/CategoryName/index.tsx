import type { Category } from '@cocktails/data';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Link from 'next/link';
import { getCategoryUrl } from '#/modules/url';
import styles from './category.module.css';

export default function CategoryName({ category }: { category: Category }) {
  return (
    <Link href={getCategoryUrl(category)} className={styles.category}>
      {category.name}&nbsp;
      <LocalOfferIcon fontSize="small" />
    </Link>
  );
}
