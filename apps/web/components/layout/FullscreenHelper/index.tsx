'use client';

import { useLayoutEffect } from 'react';

export default function FullscreenHelper() {
  useLayoutEffect(() => {
    // Hack to hide the address bar on mobile devices
    window.scrollTo(0, 1);
  });

  return null;
}
