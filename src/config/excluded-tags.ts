export const EXCLUDED_TAGS = [
  'yggdrasil'
] as const;

export type ExcludedTag = typeof EXCLUDED_TAGS[number];
