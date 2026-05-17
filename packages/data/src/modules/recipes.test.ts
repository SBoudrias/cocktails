import { describe, expect, it, vi } from 'vitest';

const execFileMocks = vi.hoisted(() => {
  const promise = vi.fn();
  const callback = Object.assign(vi.fn(), {
    [Symbol.for('nodejs.util.promisify.custom')]: promise,
  });
  return { callback, promise };
});

vi.mock('node:child_process', () => ({
  execFile: execFileMocks.callback,
}));

describe('getRecentlyAddedRecipes', () => {
  it('orders recipes by git file-add date instead of recipe name', async () => {
    const repoRoot = process.cwd();
    const gitLog = [
      'COMMIT 2026-05-16T13:10:12-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/9th-wonder.json',
      'COMMIT 2026-05-18T09:00:00-04:00',
      'packages/data/data/recipes/youtube-channel/educated-barfly/snake-eyes.json',
      'packages/data/data/recipes/youtube-channel/anders-erickson/belmont-jewel.json',
    ].join('\n');

    execFileMocks.promise.mockImplementation((command, args, options) => {
      if (args.includes('rev-parse')) {
        return Promise.resolve({ stdout: `${repoRoot}\n`, stderr: '' });
      }

      expect(command).toBe('git');
      expect(options).toEqual({ cwd: repoRoot });
      expect(args).toContain('--diff-filter=A');
      return Promise.resolve({ stdout: gitLog, stderr: '' });
    });

    const { getRecentlyAddedRecipes } = await import('./recipes');
    const recipes = await getRecentlyAddedRecipes();

    expect(recipes.map((recipe) => recipe.name)).toEqual([
      'Snake Eyes',
      'Belmont Jewel',
      '9th Wonder',
    ]);
  });
});
