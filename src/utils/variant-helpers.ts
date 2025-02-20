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
  variantIndex: number,
  products?: Array<{
    sku: string;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
    quantity: number;
  }>
): string => {
  // S'assurer que l'ID de la commande est déjà encodé
  const encodedOrderId = orderId.includes('--') ? orderId : encodeFirestoreId(orderId);

  // Si on a la liste des produits, on peut calculer un index global
  let globalIndex = 0;
  if (products) {
    const currentProduct = {
      sku,
      selectedOptions: [
        { name: 'Couleur', value: color || 'no-color' },
        { name: 'Taille', value: size || 'no-size' }
      ]
    };
    globalIndex = calculateGlobalVariantIndex(products, currentProduct, productIndex);
    globalIndex += variantIndex;
  } else {
    // Sinon on utilise les index fournis
    globalIndex = productIndex * 100 + variantIndex; // Multiplier par 100 pour éviter les collisions
  }

  const id = `${encodedOrderId}--${sku}--${color || 'no-color'}--${size || 'no-size'}--${globalIndex}`;
  return encodeFirestoreId(id);
};
