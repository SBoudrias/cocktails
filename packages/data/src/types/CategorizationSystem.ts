import { type Category } from './Category.ts';
import { type Ref } from './Ref.ts';

export type CategorizationSystemNode = {
  name: string;
  categoryType?: Category['categoryType'];
  description?: string;
  parents?: string[];
  substitutable?: boolean;
  /** Systems this category's subtree is deliberately outside of. */
  outsideOf?: string[];
  refs?: Ref[];
};

export type CategorizationSystem = {
  name: string;
  slug: string;
  description?: string;
  /** Top-level categories whose members this system classifies. */
  covers?: string[];
  nodes: (CategorizationSystemNode & { slug: string })[];
};
