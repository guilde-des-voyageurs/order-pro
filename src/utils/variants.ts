import { encodeFirestoreId } from './firestore-helpers';

export interface Product {
  sku: string;
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface Variant {
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  productIndex: number;
  variantIndex: number;
  orderId: string;
}

/**
 * Extrait la couleur d'un produit à partir de ses options
 */
export const getProductColor = (product: Product | undefined | null): string => {
  if (!product?.selectedOptions) return 'no-color';
  
  return product.selectedOptions.find(
    opt => opt.name.toLowerCase().includes('couleur')
  )?.value || 'no-color';
};

/**
 * Extrait la taille d'un produit à partir de ses options
 */
export const getProductSize = (product: Product | undefined | null): string => {
  if (!product?.selectedOptions) return 'no-size';
  
  return product.selectedOptions.find(
    opt => opt.name.toLowerCase().includes('taille')
  )?.value || 'no-size';
};

/**
 * Transforme une couleur en format lisible
 */
export const transformColor = (color: string | null): string => {
  if (!color) return 'Sans couleur';
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
};

/**
 * Calcule l'index global d'une variante en comptant toutes les variantes identiques qui la précèdent
 */
export const calculateGlobalVariantIndex = (
  products: Product[],
  currentProduct: Product | undefined | null,
  productIndex: number
): number => {
  if (!currentProduct) return productIndex;

  const currentColor = getProductColor(currentProduct);
  const currentSize = getProductSize(currentProduct);

  // Compter le nombre total de variantes identiques avant celle-ci
  let globalIndex = 0;
  
  for (let i = 0; i < productIndex; i++) {
    const product = products[i];
    if (!product) continue;

    const color = getProductColor(product);
    const size = getProductSize(product);
    
    if (product.sku === currentProduct.sku && color === currentColor && size === currentSize) {
      globalIndex += product.quantity || 0;
    }
  }

  return globalIndex;
};

/**
 * Génère un ID unique pour une variante
 */
export const generateVariantId = (
  orderId: string,
  sku: string, 
  color: string | null, 
  size: string | null,
  productIndex: number,
  variantIndex: number,
  products?: Product[]
): string => {
  // S'assurer que l'ID de la commande est déjà encodé
  const encodedOrderId = orderId.includes('--') ? orderId : encodeFirestoreId(orderId);
  
  // Créer un ID unique qui ne dépend que des attributs de la variante
  const id = `${encodedOrderId}--${sku}--${color || 'no-color'}--${size || 'no-size'}--${productIndex}--${variantIndex}`;
  return encodeFirestoreId(id);
};

/**
 * Transforme un produit en une liste de variantes
 */
export const productToVariants = (
  product: Product | undefined | null, 
  productIndex: number,
  orderId: string
): Variant[] => {
  if (!product) return [];

  const color = getProductColor(product);
  const size = getProductSize(product);
  const quantity = product.quantity || 0;

  return Array(quantity).fill(null).map((_, index) => ({
    sku: product.sku,
    color,
    size,
    quantity: 1,
    productIndex,
    variantIndex: index,
    orderId
  }));
};

/**
 * Groupe les variantes par SKU, couleur et taille
 */
export const groupVariantsByAttributes = (variants: Variant[]): Record<string, Variant[]> => {
  return variants.reduce((acc, variant) => {
    if (!variant) return acc;

    const key = `${variant.sku}--${variant.color}--${variant.size}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(variant);
    return acc;
  }, {} as Record<string, Variant[]>);
};
