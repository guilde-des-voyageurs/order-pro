import { encodeFirestoreId } from './firestore-helpers';

export const calculateGlobalVariantIndex = (
  products: Array<{
    sku: string;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
    quantity: number;
  }>,
  currentProduct: {
    sku: string;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  },
  currentIndex: number
): number => {
  const getOptionValue = (product: any, optionName: string): string | null => {
    const value = product.selectedOptions.find(
      (opt: any) => opt.name.toLowerCase().includes(optionName.toLowerCase())
    )?.value;
    return value ?? null;
  };

  const currentColor = getOptionValue(currentProduct, 'couleur') || 'no-color';
  const currentSize = getOptionValue(currentProduct, 'taille') || 'no-size';

  // Compter le nombre total de variantes identiques avant celle-ci
  let globalIndex = 0;
  
  for (let i = 0; i < currentIndex; i++) {
    const product = products[i];
    const color = getOptionValue(product, 'couleur') || 'no-color';
    const size = getOptionValue(product, 'taille') || 'no-size';
    
    if (product.sku === currentProduct.sku && color === currentColor && size === currentSize) {
      globalIndex += product.quantity;
    }
  }

  return globalIndex;
};

/**
 * Détermine le SKU par défaut en fonction du titre de l'article
 */
export const getDefaultSku = (title: string): string => {
  const normalizedTitle = title.toLowerCase();
  
  if (normalizedTitle.includes('sweatshirt')) {
    return 'DRUMMER (ou CRUISER)';
  }
  
  if (normalizedTitle.includes('t-shirt')) {
    return 'CREATOR 2.0';
  }

  if (normalizedTitle.includes('t-shirt femme')) {
    return 'MUSER';
  }
  
  return 'SKU MANQUANT';
};

export const generateVariantId = (
  orderId: string,
  sku: string, 
  color: string | null, 
  size: string | null,
  productIndex: number,
  lineItemIndex?: number
): string => {
  // Vérifier que le SKU n'est pas vide
  if (!sku?.trim()) {
    throw new Error('SKU cannot be empty');
  }
  
  // Nettoyer les valeurs
  const cleanColor = color?.trim() || 'no-color';
  const cleanSize = size?.trim() || 'no-size';
  
  // Créer un ID cohérent avec productIndex et quantityIndex
  // Format: orderId--sku--color--size--productIndex--quantityIndex
  return `${orderId}--${sku}--${cleanColor}--${cleanSize}--${productIndex}--${lineItemIndex ?? 0}`;
};
