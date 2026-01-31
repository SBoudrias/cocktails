import { Suspense } from 'react';
import SearchRedirect from './SearchRedirect';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchRedirect />
    </Suspense>
  );
}
