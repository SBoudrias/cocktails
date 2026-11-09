import { getSerializedSearchIndex } from '#/modules/buildSearchIndex';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await getSerializedSearchIndex(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
