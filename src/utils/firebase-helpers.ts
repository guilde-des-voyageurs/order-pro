/**
 * Encode un ID pour qu'il soit utilisable comme chemin dans Firebase
 * Les IDs peuvent être au format :
 * - 'gid://shopify/Order/123456789' (ID Shopify complet)
 * - '123456789' (juste le numéro)
 */
export const encodeFirestoreId = (id: string): string => {
  // Si l'ID contient //, c'est un ID Shopify complet
  if (id.includes('//')) {
    // Extraire uniquement le numéro à la fin
    const matches = id.match(/\/([^/]+)$/);
    if (!matches) {
      throw new Error(`Invalid Shopify ID format: ${id}`);
    }
    return matches[1];
  }
  
  // Sinon c'est déjà juste le numéro
  return id;
};
