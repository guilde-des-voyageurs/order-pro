const SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL'
];

/**
 * Obtient l'index de tri d'une taille
 * @param size Taille à évaluer
 * @returns Index dans l'ordre de tri (-1 si non trouvé)
 */
export function getSizeIndex(size: string): number {
  return SIZE_ORDER.indexOf(size.toUpperCase());
}

/**
 * Compare deux tailles pour le tri
 * @param sizeA Première taille
 * @param sizeB Deuxième taille
 * @returns -1 si sizeA < sizeB, 0 si égal, 1 si sizeA > sizeB
 */
export function compareSizes(sizeA: string, sizeB: string): number {
  const indexA = getSizeIndex(sizeA);
  const indexB = getSizeIndex(sizeB);

  // Si les deux tailles ne sont pas dans la liste, on les compare alphabétiquement
  if (indexA === -1 && indexB === -1) {
    return sizeA.localeCompare(sizeB);
  }

  // Si une seule taille n'est pas dans la liste, on la met à la fin
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;

  // Sinon on compare leurs indices
  return indexA - indexB;
}
