import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchRedirect from './SearchRedirect';

export const metadata: Metadata = {
  title: 'Indexotica | Search',
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchRedirect />
    </Suspense>
  );
}
