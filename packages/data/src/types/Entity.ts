export type Author = {
  name: string;
  slug: string;
  links?: [string, ...string[]];
  description?: string;
};

export type Bar = {
  name: string;
  slug: string;
  location?: string;
  links?: [string, ...string[]];
  description?: string;
};
