'use client';

import type { Route } from 'next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    const url: Route = search
      ? `/list/recipes?search=${encodeURIComponent(search)}`
      : '/list/recipes';
    router.replace(url);
  }, [router, searchParams]);

  return null;
}
