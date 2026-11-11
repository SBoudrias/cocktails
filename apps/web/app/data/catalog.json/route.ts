import { getSerializedCatalog } from '#/modules/buildCatalog';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await getSerializedCatalog(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
