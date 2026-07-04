import fs from 'node:fs/promises';
import path from 'node:path';
import { RECIPE_ROOT } from '@cocktails/data/constants';

const PROJECT_ROOT = path.resolve(RECIPE_ROOT, '../../../..');

export type RecipeVideoReference = {
  videoId: string;
  recipePath: string;
  start?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

function readNumber(value: Record<string, unknown>, key: string): number | undefined {
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
}

function getYoutubeRefs(recipe: unknown): Array<{ videoId: string; start?: number }> {
  if (!isRecord(recipe) || !Array.isArray(recipe.refs)) return [];

  return recipe.refs.flatMap((ref): Array<{ videoId: string; start?: number }> => {
    if (!isRecord(ref) || readString(ref, 'type') !== 'youtube') return [];

    const videoId = readString(ref, 'videoId');
    if (!videoId) return [];

    return [{ videoId, start: readNumber(ref, 'start') }];
  });
}

export async function collectRecipeVideoReferences(): Promise<
  Map<string, RecipeVideoReference[]>
> {
  const videoReferences = new Map<string, RecipeVideoReference[]>();

  async function scanDirectory(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
        continue;
      }

      if (!entry.name.endsWith('.json') || entry.name === '_source.json') {
        continue;
      }

      try {
        const recipe: unknown = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
        const recipePath = path.relative(PROJECT_ROOT, fullPath);

        for (const ref of getYoutubeRefs(recipe)) {
          const references = videoReferences.get(ref.videoId) ?? [];
          references.push({ videoId: ref.videoId, recipePath, start: ref.start });
          videoReferences.set(ref.videoId, references);
        }
      } catch {
        // Skip recipe files that cannot be parsed.
      }
    }
  }

  await scanDirectory(RECIPE_ROOT);
  return videoReferences;
}

export function getVideoIdsFromRecipeReferences(
  references: Map<string, RecipeVideoReference[]>,
): Set<string> {
  return new Set(references.keys());
}
