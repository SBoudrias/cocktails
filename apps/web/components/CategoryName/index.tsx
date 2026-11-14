import type { Category } from '@cocktails/data';
import { Tag } from 'lucide-react';
import Link from 'next/link';
import { getCategoryUrl } from '#/modules/url';
import styles from './category.module.css';

export default function CategoryName({ category }: { category: Category }) {
  return (
    <Link href={getCategoryUrl(category)} className={styles.category}>
      {category.name}&nbsp;
      <Tag className="size-5" aria-hidden="true" />
    </Link>
  );
}
