'use client';

import type { Route } from 'next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRecipeListUrl } from '@/modules/url';

export default function SearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    const url = search
      ? (`${getRecipeListUrl()}?${new URLSearchParams({ search })}` as Route)
      : getRecipeListUrl();
    router.replace(url);
  }, [router, searchParams]);

  return null;
}
