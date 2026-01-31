export type ListConfig<T> = {
  groupBy: (item: T) => string;
  sortItemBy: (itemA: T, itemB: T) => number;
  sortHeaderBy: (headerA: string, headerB: string) => number;
};
