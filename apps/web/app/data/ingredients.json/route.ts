import { getSerializedIngredientPages } from '#/modules/buildIngredientPages';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await getSerializedIngredientPages(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
