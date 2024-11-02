import { Ref } from './Ref';

export type Category = {
  name: string;
  slug: string;
  description?: string;
  parents: Category[];
  refs: Ref[];
};
