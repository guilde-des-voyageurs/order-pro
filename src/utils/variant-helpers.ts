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

export const generateVariantId = (
  orderId: string,
  sku: string, 
  color: string | null, 
  size: string | null,
  productIndex: number,
  lineItemIndex?: number
): string => {
  // Nettoyer les valeurs
  const cleanColor = color?.trim() || 'no-color';
  const cleanSize = size?.trim() || 'no-size';
  
  // Encoder l'ID pour Firebase
  const encodedOrderId = encodeFirestoreId(orderId);
  
  // Créer l'ID avec l'index de l'article
  const uniqueIdentifier = lineItemIndex !== undefined ? `--item${lineItemIndex}` : '';
  return `${encodedOrderId}--${sku}--${cleanColor}--${cleanSize}--${productIndex}${uniqueIdentifier}`;
};
