import { getSerializedCategoryPages } from '#/modules/buildCategoryPages';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await getSerializedCategoryPages(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
