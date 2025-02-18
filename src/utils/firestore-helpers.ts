/**
 * Encode un ID pour une utilisation sécurisée dans Firestore
 * Gère les IDs Shopify et autres IDs contenant des caractères spéciaux
 */
export const encodeFirestoreId = (id: string): string => {
  // Remplacer tous les caractères non autorisés par leur équivalent encodé
  return id
    .replace(/\//g, '--slash--')
    .replace(/\./g, '--dot--')
    .replace(/:/g, '--colon--')
    .replace(/@/g, '--at--')
    .replace(/\s/g, '--space--');
};

/**
 * Décode un ID Firestore en ID original
 */
export const decodeFirestoreId = (encodedId: string): string => {
  return encodedId
    .replace(/--slash--/g, '/')
    .replace(/--dot--/g, '.')
    .replace(/--colon--/g, ':')
    .replace(/--at--/g, '@')
    .replace(/--space--/g, ' ');
};
