/**
 * Ref represent a reference to an external resource.
 *
 * When used in arrays, order by priority/relevance.
 */
export type Ref = {
  type: 'youtube';
  videoId: string;
  start?: number;
};
