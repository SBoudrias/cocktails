import { type Category } from './Category.ts';
import { type Ref } from './Ref.ts';

export type CategorizationSystemNode = {
  name: string;
  categoryType?: Category['categoryType'];
  description?: string;
  parents?: string[];
  substitutable?: boolean;
  refs?: Ref[];
};

export type CategorizationSystem = {
  name: string;
  slug: string;
  description?: string;
  /** The system's names as written in its source, mapped to node names. */
  canonicalNames?: Record<string, string>;
  /** Top-level categories whose members this system classifies. */
  covers?: string[];
  nodes: (CategorizationSystemNode & { slug: string })[];
  exemptions?: Array<{ ingredient: string; reason: string }>;
};
