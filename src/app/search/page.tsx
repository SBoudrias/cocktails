import { redirect } from 'next/navigation';

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  return searchParams.then((params) => {
    const url = params.search
      ? `/list/recipes?search=${encodeURIComponent(params.search)}`
      : '/list/recipes';
    redirect(url);
  });
}
