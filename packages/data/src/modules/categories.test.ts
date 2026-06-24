import { describe, expect, it } from 'vitest';
import { getCategory, getChildCategories } from './categories';

describe('getChildCategories', () => {
  it('returns nested child categories once', async () => {
    const childCategories = await getChildCategories(await getCategory('rum'));
    const slugs = childCategories.map(({ slug }) => slug);

    expect(slugs).toEqual(
      expect.arrayContaining([
        'aged-rum',
        'blended-aged-rum',
        'blended-aged-rum-jamaica',
        'navy-strength-jamaican-rum',
      ]),
    );
    expect(slugs).not.toContain('rum');
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
