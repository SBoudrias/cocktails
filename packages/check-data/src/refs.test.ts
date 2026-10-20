import { describe, expect, it, vi } from 'vitest';
import type { DataContext } from './data-context.ts';
import { checkRefs } from './refs.ts';

vi.mock('./cli-util.ts', () => ({
  logger: {
    header: vi.fn(),
    item: vi.fn(),
    footer: vi.fn(),
    error: vi.fn(),
    change: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    failure: vi.fn(),
  },
}));

function makeCtx(overrides: Partial<DataContext> = {}): DataContext {
  return {
    categorySlugs: new Set(),
    canonicalNames: new Map(),
    categoryTypes: new Map(),
    youtubeChannelSlugs: new Set(['educated-barfly']),
    sourceSlugsByType: new Map(),
    authorEntitySlugs: new Set(),
    barEntitySlugs: new Set(),
    barLocationUsages: [],
    categoryCanonicalNames: new Map(),
    allCategories: [],
    ingredientFolders: new Map(),
    ingredientFiles: new Map(),
    ingredients: [],
    ingredientNames: [],
    ingredientFilesByName: new Map(),
    barNameCasings: new Map(),
    approvedOverlaps: { author: [], bar: [], ingredient: [] },
    authorNameUsages: new Map(),
    untrackedRefChannels: new Map(),
    referencedIngredientSlugs: new Set(),
    ...overrides,
  };
}

describe('checkRefs', () => {
  it('counts untracked channels', () => {
    const ctx = makeCtx();
    checkRefs({
      data: {
        $schema: '',
        name: 'Recipe',
        refs: [
          { type: 'youtube', channel: 'totally-untracked' },
          { type: 'youtube', channel: 'totally-untracked' },
        ],
      },
      file: 'recipe.json',
      schemaPath: 'schemas/recipe.schema.json',
      isValid: true,
      ctx,
      report: { fail: vi.fn(), warn: vi.fn(), change: vi.fn() },
      writeJSON: vi.fn(async () => {}),
    });
    expect(ctx.untrackedRefChannels.get('totally-untracked')).toBe(2);
  });

  it('ignores tracked channels', () => {
    const ctx = makeCtx();
    checkRefs({
      data: {
        $schema: '',
        name: 'Recipe',
        refs: [{ type: 'youtube', channel: 'educated-barfly' }],
      },
      file: 'recipe.json',
      schemaPath: 'schemas/recipe.schema.json',
      isValid: true,
      ctx,
      report: { fail: vi.fn(), warn: vi.fn(), change: vi.fn() },
      writeJSON: vi.fn(async () => {}),
    });
    expect(ctx.untrackedRefChannels.size).toBe(0);
  });

  it('ignores files outside recipe, category and ingredient schemas', () => {
    const ctx = makeCtx();
    checkRefs({
      data: {
        $schema: '',
        name: 'Someone',
        refs: [{ type: 'youtube', channel: 'totally-untracked' }],
      },
      file: 'author.json',
      schemaPath: 'schemas/author.schema.json',
      isValid: true,
      ctx,
      report: { fail: vi.fn(), warn: vi.fn(), change: vi.fn() },
      writeJSON: vi.fn(async () => {}),
    });
    expect(ctx.untrackedRefChannels.size).toBe(0);
  });
});
