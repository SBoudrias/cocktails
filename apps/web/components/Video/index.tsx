'use client';

import { useEffect } from 'react';
import 'lite-youtube-embed/src/lite-yt-embed.css';
import style from './style.module.css';

export default function Video({ id, start }: { id: string; start?: number }) {
  useEffect(() => {
    import('lite-youtube-embed');
  }, []);

  const searchParams = new URLSearchParams();
  if (start) {
    searchParams.set('start', start.toString());
  }

  return (
    <div className={style.wrapper}>
      <div className={style.player}>
        <lite-youtube videoid={id} params={searchParams.toString()} />
      </div>
    </div>
  );
}
