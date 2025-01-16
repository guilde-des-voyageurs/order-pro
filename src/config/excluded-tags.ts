export const EXCLUDED_TAGS = [
  // Ajoutez ici les tags à exclure
  // Exemple : 'test', 'draft', etc.
] as const;

export type ExcludedTag = typeof EXCLUDED_TAGS[number];
