import { encodeFirestoreId } from './firestore-helpers';
import { transformColor } from './color-transformer';

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
    // Pour les variantes à 3+ niveaux : dernier = taille, avant-dernier = couleur
    return parts.map((value: string, index: number) => {
      let name = `Option${index + 1}`;
      
      // Dernier élément = Taille
      if (index === parts.length - 1) {
        name = 'Taille';
      }
      // Avant-dernier élément = Couleur
      else if (index === parts.length - 2) {
        name = 'Couleur';
      }
      // Premier élément si seulement 1 élément = Couleur
      else if (parts.length === 1 && index === 0) {
        name = 'Couleur';
      }
      
      // NE PAS transformer ici - on transforme uniquement à l'affichage
      return { name, value: value.trim() };
    });
  }
  
  return undefined;
};

/**
 * Extrait la couleur depuis selectedOptions ou variantTitle (fallback)
 * Applique transformColor AU PLUS TÔT pour avoir des noms cohérents dans les IDs
 * Pour 3+ niveaux : avant-dernier élément = couleur
 */
export const getColorFromVariant = (item: any): string => {
  const selectedOptions = getSelectedOptions(item);
  
  if (selectedOptions && selectedOptions.length > 0) {
    const colorOption = selectedOptions.find(opt => 
      opt.name.toLowerCase().includes('couleur') || opt.name.toLowerCase().includes('color')
    );
    const rawColor = colorOption?.value || 'no-color';
    return transformColor(rawColor);
  }
  
  // Fallback direct sur variantTitle
  const parts = item.variantTitle?.split(' / ') || [];
  if (parts.length === 0) return 'no-color';
  
  // Pour 3+ niveaux : avant-dernier = couleur
  const rawColor = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return transformColor(rawColor?.trim() || 'no-color');
};

/**
 * Extrait la taille depuis selectedOptions ou variantTitle (fallback)
 * Pour 3+ niveaux : dernier élément = taille
 */
export const getSizeFromVariant = (item: any): string => {
  const selectedOptions = getSelectedOptions(item);
  
  if (selectedOptions && selectedOptions.length > 0) {
    const sizeOption = selectedOptions.find(opt => 
      opt.name.toLowerCase().includes('taille') || opt.name.toLowerCase().includes('size')
    );
    return sizeOption?.value || 'no-size';
  }
  
  // Fallback direct sur variantTitle
  const parts = item.variantTitle?.split(' / ') || [];
  if (parts.length === 0) return 'no-size';
  
  // Dernier élément = taille
  return parts[parts.length - 1]?.trim() || 'no-size';
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
  
  // IMPORTANT: On utilise UNIQUEMENT color et size pour l'ID
  // Les autres options (comme "Hibou" pour l'impression) ne doivent PAS être dans l'ID
  // car elles ne servent qu'à informer l'imprimeur, pas à identifier la checkbox
  const cleanColor = color?.trim() || 'no-color';
  const cleanSize = size?.trim() || 'no-size';
  
  // Créer un ID cohérent avec productIndex et quantityIndex
  // Format: orderId--sku--color--size--productIndex--quantityIndex
  return `${orderId}--${sku}--${cleanColor}--${cleanSize}--${productIndex}--${lineItemIndex ?? 0}`;
};
