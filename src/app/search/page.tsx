'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    const url = search
      ? `/list/recipes?search=${encodeURIComponent(search)}`
      : '/list/recipes';
    router.replace(url);
  }, [router, searchParams]);

  return null;
}
