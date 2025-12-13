import { encodeFirestoreId } from './firestore-helpers';
import { transformColor } from './color-transformer';

/**
 * Extrait les selectedOptions depuis un lineItem Shopify
 * Note: selectedOptions n'est pas disponible dans l'API, on parse variantTitle à la place
 * IMPORTANT : Filtre "Variante de motif" qui ne doit pas être dans les IDs
 */
export const getSelectedOptions = (item: any): Array<{name: string, value: string}> | undefined => {
  // Si selectedOptions existe (cas futur si Shopify le supporte)
  if (item?.variant?.selectedOptions && item.variant.selectedOptions.length > 0) {
    // Filtrer "Variante de motif"
    return item.variant.selectedOptions.filter((opt: any) => {
      const name = opt.name.toLowerCase();
      return !(name.includes('variante') && name.includes('motif'));
    });
  }
  
  // Fallback: parser le variantTitle et créer un tableau d'options
  if (item?.variantTitle) {
    const parts = item.variantTitle.split(' / ').filter((p: string) => p.trim());
    
    // Liste des couleurs connues pour identifier quelle partie est la couleur
    const knownColors = ['Black', 'French Navy', 'Stargazer', 'Vintage white', 'Raw', 'Green Bay', 
                         'Burgundy', 'Cream', 'Dusk', 'Khaki', 'Heritage Brown', 'Glazed Green', 
                         'Bottle Green', 'Red Brown', 'Mocha', 'India Ink Grey', 'Desert', 
                         'Latte', 'Vert ancien', 'Bleu Marine', 'Bleu marine', 'Bordeaux', 'Noir',
                         'Chocolat', 'Terra Cotta', 'Vert Forêt', 'Vert Antique', 'Prune', 
                         'Bleu Azur', 'Blanc ancien', 'Ecru', 'Bleu Nuit', 'Crème', 'Nocturne', 'Kaki'];
    
    // Liste des tailles connues
    const knownSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
    
    return parts
      .map((value: string, index: number) => {
        const trimmedValue = value.trim();
        let name = `Option${index + 1}`;
        
        // Identifier le type d'option
        if (knownSizes.includes(trimmedValue)) {
          name = 'Taille';
        } else if (knownColors.some(color => color.toLowerCase() === trimmedValue.toLowerCase())) {
          name = 'Couleur';
        } else {
          // Si ce n'est ni une taille ni une couleur, c'est probablement "Variante de motif"
          name = 'Variante de motif';
        }
        
        return { name, value: trimmedValue };
      })
      // Filtrer "Variante de motif"
      .filter((opt: {name: string, value: string}) => opt.name !== 'Variante de motif');
  }
  
  return undefined;
};

/**
 * Extrait la couleur depuis selectedOptions ou variantTitle (fallback)
 * Applique transformColor AU PLUS TÔT pour avoir des noms cohérents dans les IDs
 * IMPORTANT : Ignore "Variante de motif" qui est pour l'impression, pas le textile
 * Pour 3+ niveaux : avant-dernier élément = couleur
 */
export const getColorFromVariant = (item: any): string => {
  const selectedOptions = getSelectedOptions(item);
  
  if (selectedOptions && selectedOptions.length > 0) {
    // Chercher l'option "Couleur" explicitement (en ignorant "Variante de motif")
    const colorOption = selectedOptions.find(opt => {
      const name = opt.name.toLowerCase();
      // Ignorer "Variante de motif"
      if (name.includes('variante') && name.includes('motif')) {
        return false;
      }
      return name.includes('couleur') || name.includes('color');
    });
    if (colorOption) {
      return transformColor(colorOption.value);
    }
  }
  
  // Fallback direct sur variantTitle
  const parts = item.variantTitle?.split(' / ') || [];
  if (parts.length === 0) return 'no-color';
  
  // Liste des couleurs connues pour identifier la couleur dans le variantTitle
  const knownColors = ['Black', 'French Navy', 'Stargazer', 'Vintage white', 'Raw', 'Green Bay', 
                       'Burgundy', 'Cream', 'Dusk', 'Khaki', 'Heritage Brown', 'Glazed Green', 
                       'Bottle Green', 'Red Brown', 'Mocha', 'India Ink Grey', 'Desert', 
                       'Latte', 'Vert ancien', 'Bleu Marine', 'Bleu marine', 'Bordeaux', 'Noir',
                       'Chocolat', 'Terra Cotta', 'Vert Forêt', 'Vert Antique', 'Prune', 
                       'Bleu Azur', 'Blanc ancien', 'Ecru', 'Bleu Nuit', 'Crème', 'Nocturne', 'Kaki'];
  
  // Chercher quelle partie correspond à une couleur connue
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (knownColors.some(color => color.toLowerCase() === trimmedPart.toLowerCase())) {
      return transformColor(trimmedPart);
    }
  }
  
  // Si aucune couleur connue n'est trouvée, utiliser l'avant-dernier élément
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
export const getDefaultSku = (title: string | null | undefined): string => {
  if (!title) return 'SKU MANQUANT';
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
