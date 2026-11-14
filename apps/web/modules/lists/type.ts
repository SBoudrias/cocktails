export type ListConfig<T> = {
  groupBy: (item: T) => string;
  sortItemBy: (itemA: T, itemB: T) => number;
  sortHeaderBy: (headerA: string, headerB: string) => number;
  /**
   * Ordered index domain shown in the floating index bar.
   * Defaults to `#` + A-Z. Chapter grouping uses chapter numbers (`01`..`N`).
   */
  indexes?: string[];
  /**
   * Maps a group header to the index it appears under in the bar.
   * Defaults to the header itself (alphabetical grouping).
   */
  groupByIndex?: (header: string) => string;
};
