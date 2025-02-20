export const calculateGlobalVariantIndex = (
  products: Array<{
    sku: string;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
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

  const currentColor = getOptionValue(currentProduct, 'couleur');
  const currentSize = getOptionValue(currentProduct, 'taille');
  const currentKey = `${currentProduct.sku}--${currentColor || 'no-color'}--${currentSize || 'no-size'}`;

  // Compter combien de variantes identiques il y a avant celle-ci
  return products
    .slice(0, currentIndex)
    .filter(product => {
      const color = getOptionValue(product, 'couleur');
      const size = getOptionValue(product, 'taille');
      const key = `${product.sku}--${color || 'no-color'}--${size || 'no-size'}`;
      return key === currentKey;
    })
    .length;
};
