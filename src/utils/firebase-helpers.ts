/**
 * Encode un ID pour qu'il soit utilisable comme chemin dans Firebase
 * Les IDs Shopify sont au format 'gid://shopify/Order/123456789'
 * et doivent être encodés car ils contiennent des caractères invalides
 */
export const encodeFirestoreId = (id: string): string => {
  // Extraire uniquement le numéro à la fin
  const matches = id.match(/\/([^/]+)$/);
  if (!matches) {
    throw new Error(`Invalid Shopify ID format: ${id}`);
  }
  return matches[1];
};
