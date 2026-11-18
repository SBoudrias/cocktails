import { getRecipeStyles, getRecipesByStyle } from '@cocktails/data/styles';
import type { Metadata } from 'next';
import AppHeader from '#/components/AppHeader';
import { LinkList, LinkListItem } from '#/components/list/LinkList';
import { List } from '#/components/ui/list';
import { getStyleRecipesUrl } from '#/modules/url';

export const metadata: Metadata = {
  title: 'Indexotica | Cocktail Styles',
  description:
    'Browse cocktails by style: tiki, the classic prep families and the six root families every drink varies on.',
};

export default async function StyleListPage() {
  const styles = await Promise.all(
    getRecipeStyles().map(async (style) => ({
      style,
      // A style nothing in the corpus matches links nowhere.
      recipeCount: (await getRecipesByStyle(style.slug)).length,
    })),
  );

  return (
    <>
      <AppHeader title="Cocktails by Style" />
      <List className="mt-4 py-2">
        <LinkList
          header="Styles"
          items={styles.filter(({ recipeCount }) => recipeCount > 0)}
          renderItem={({ style, recipeCount }) => (
            <LinkListItem
              key={style.slug}
              href={getStyleRecipesUrl(style)}
              primary={style.name}
              secondary={style.description}
              count={recipeCount}
            />
          )}
        />
      </List>
    </>
  );
}
