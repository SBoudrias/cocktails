'use client';

import { Card } from 'antd-mobile';
import YouTube from 'react-youtube';
import style from './style.module.css';

export default function Video({ id }: { id: string }) {
  return (
    <Card title="Video" style={{ margin: '24px 12px' }}>
      <YouTube className={style.player} videoId={id} />
    </Card>
  );
}
