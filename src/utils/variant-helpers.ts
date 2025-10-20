import { encodeFirestoreId } from './firestore-helpers';

/**
 * Extrait les selectedOptions depuis un lineItem Shopify
 * Note: selectedOptions n'est pas disponible dans l'API, on parse variantTitle à la place
 */
export const getSelectedOptions = (item: any): Array<{name: string, value: string}> | undefined => {
  // Si selectedOptions existe (cas futur si Shopify le supporte)
  if (item?.variant?.selectedOptions && item.variant.selectedOptions.length > 0) {
    return item.variant.selectedOptions;
  }
  
  // Fallback: parser le variantTitle et créer un tableau d'options
  if (item?.variantTitle) {
    const parts = item.variantTitle.split(' / ').filter((p: string) => p.trim());
    // Créer des options génériques avec des noms basés sur la position
    return parts.map((value: string, index: number) => ({
      name: index === 0 ? 'Couleur' : index === 1 ? 'Taille' : `Option${index + 1}`,
      value: value.trim()
    }));
  }
  
  return undefined;
};

/**
 * Extrait la couleur depuis selectedOptions ou variantTitle (fallback)
 */
export const getColorFromVariant = (item: any): string => {
  const selectedOptions = getSelectedOptions(item);
  if (selectedOptions && selectedOptions.length > 0) {
    const colorOption = selectedOptions.find(opt => 
      opt.name.toLowerCase().includes('couleur') || opt.name.toLowerCase().includes('color')
    );
    return colorOption?.value || selectedOptions[0].value || 'no-color';
  }
  // Fallback direct sur variantTitle
  return item.variantTitle?.split(' / ')[0]?.trim() || 'no-color';
};

/**
 * Extrait la taille depuis selectedOptions ou variantTitle (fallback)
 */
export const getSizeFromVariant = (item: any): string => {
  const selectedOptions = getSelectedOptions(item);
  if (selectedOptions && selectedOptions.length > 1) {
    const sizeOption = selectedOptions.find(opt => 
      opt.name.toLowerCase().includes('taille') || opt.name.toLowerCase().includes('size')
    );
    return sizeOption?.value || selectedOptions[1].value || 'no-size';
  }
  // Fallback direct sur variantTitle
  return item.variantTitle?.split(' / ')[1]?.trim() || 'no-size';
};

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
  lineItemIndex?: number,
  selectedOptions?: Array<{name: string, value: string}>
): string => {
  // Vérifier que le SKU n'est pas vide
  if (!sku?.trim()) {
    throw new Error('SKU cannot be empty');
  }
  
  // Si selectedOptions est fourni, utiliser toutes les options pour générer l'ID
  if (selectedOptions && selectedOptions.length > 0) {
    // Trier les options par nom pour garantir un ordre cohérent
    const sortedOptions = selectedOptions
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(opt => opt.value.trim())
      .join('--');
    
    return `${orderId}--${sku}--${sortedOptions}--${productIndex}--${lineItemIndex ?? 0}`;
  }
  
  // Fallback pour la compatibilité avec l'ancien système (2 niveaux uniquement)
  const cleanColor = color?.trim() || 'no-color';
  const cleanSize = size?.trim() || 'no-size';
  
  // Créer un ID cohérent avec productIndex et quantityIndex
  // Format: orderId--sku--color--size--productIndex--quantityIndex
  return `${orderId}--${sku}--${cleanColor}--${cleanSize}--${productIndex}--${lineItemIndex ?? 0}`;
};
