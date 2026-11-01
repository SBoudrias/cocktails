import { describe, expect, it } from 'vitest';
import { ctx } from '../../context/data-context.ts';
import type { FileCheckInput } from '../../infra/types.ts';
import { checkRefs } from './refs.ts';

function runCheck(data: FileCheckInput['data'], schemaPath: string): void {
  checkRefs({
    data,
    file: 'recipe.json',
    schemaPath,
    isValid: true,
  });
}

describe('checkRefs', () => {
  it('counts untracked channels', () => {
    ctx.youtubeChannelSlugs = new Set(['educated-barfly']);
    ctx.untrackedRefChannels = new Map();
    runCheck(
      {
        $schema: '',
        name: 'Recipe',
        refs: [
          { type: 'youtube', channel: 'totally-untracked' },
          { type: 'youtube', channel: 'totally-untracked' },
        ],
      },
      'schemas/recipe.schema.json',
    );
    expect(ctx.untrackedRefChannels.get('totally-untracked')).toBe(2);
  });

  it('ignores tracked channels', () => {
    ctx.youtubeChannelSlugs = new Set(['educated-barfly']);
    ctx.untrackedRefChannels = new Map();
    runCheck(
      {
        $schema: '',
        name: 'Recipe',
        refs: [{ type: 'youtube', channel: 'educated-barfly' }],
      },
      'schemas/recipe.schema.json',
    );
    expect(ctx.untrackedRefChannels.size).toBe(0);
  });

  it('ignores files outside recipe, category and ingredient schemas', () => {
    ctx.untrackedRefChannels = new Map();
    runCheck(
      {
        $schema: '',
        name: 'Someone',
        refs: [{ type: 'youtube', channel: 'totally-untracked' }],
      },
      'schemas/author.schema.json',
    );
    expect(ctx.untrackedRefChannels.size).toBe(0);
  });
});
