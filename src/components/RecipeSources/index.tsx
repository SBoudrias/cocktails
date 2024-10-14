'use client';

import { Source } from '@/types/Source';
import { List, Button } from 'antd-mobile';

export default function RecipeSources({ source }: { source: Source }) {
  const clickBook = () => {
    window.open(source.link, '_blank')?.focus();
  };

  return (
    <List header="Sources" mode="card" style={{ marginTop: '24px' }}>
      <List.Item extra={<Button onClick={clickBook}>More</Button>}>
        {source.name}
      </List.Item>
    </List>
  );
}
