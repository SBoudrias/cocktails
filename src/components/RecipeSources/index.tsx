'use client';

import { Book } from '@/types/Source';
import { List, Button } from 'antd-mobile';

export default function RecipeSources({ book }: { book: Book }) {
  console.log(book);
  const clickBook = () => {
    window.open(book.link, '_blank')?.focus();
  };

  return (
    <List header="Sources" mode="card" style={{ marginTop: '24px' }}>
      <List.Item extra={<Button onClick={clickBook}>More</Button>}>
        {book.title}
      </List.Item>
    </List>
  );
}
