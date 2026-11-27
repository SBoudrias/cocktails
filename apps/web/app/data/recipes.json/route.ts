import { getSerializedRecipePages } from '#/modules/buildRecipePages';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await getSerializedRecipePages(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
