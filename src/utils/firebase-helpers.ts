/**
 * Extrait l'ID numérique d'un ID Shopify GraphQL
 * Les IDs peuvent être au format :
 * - 'gid://shopify/Order/123456789' (ID Shopify complet)
 * - '123456789' (juste le numéro)
 * 
 * @deprecated Utilisez extractShopifyId à la place
 */
export const encodeFirestoreId = (id: string | null | undefined): string => {
  return extractShopifyId(id);
};

/**
 * Extrait l'ID numérique d'un ID Shopify GraphQL
 * Les IDs peuvent être au format :
 * - 'gid://shopify/Order/123456789' (ID Shopify complet)
 * - '123456789' (juste le numéro)
 */
export const extractShopifyId = (id: string | null | undefined): string => {
  if (!id) return '';
  
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
