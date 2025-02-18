'use client';

import { Stack, Text, Title } from '@mantine/core';

interface Product {
  quantity: number;
  sku: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface OrderDetail {
  type: 'success';
  data: {
    products: Product[];
  };
}

interface ProductsSummaryProps {
  orderDetails: Record<string, OrderDetail>;
}

interface ProductTotal {
  sku: string;
  color?: string;
  size?: string;
  total: number;
}

export const ProductsSummary = ({ orderDetails }: ProductsSummaryProps) => {
  // Agréger les quantités par produit (SKU + couleur + taille)
  const productTotals = Object.values(orderDetails)
    .filter((detail): detail is OrderDetail => detail?.type === 'success')
    .flatMap(detail => detail.data.products)
    .reduce((acc: ProductTotal[], product) => {
      const color = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('couleur')
      )?.value;
      const size = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('taille')
      )?.value;

      const key = `${product.sku}-${color || ''}-${size || ''}`;
      const existing = acc.find(p => 
        p.sku === product.sku && 
        p.color === color && 
        p.size === size
      );

      if (existing) {
        existing.total += product.quantity;
      } else {
        acc.push({ sku: product.sku, color, size, total: product.quantity });
      }

      return acc;
    }, [])
    .sort((a, b) => b.total - a.total); // Trier par quantité décroissante

  return (
    <Stack>
      <Title order={3}>Total des produits commandés</Title>
      <Stack gap="xs">
        {productTotals.map((product, index) => (
          <Text key={index} size="sm">
            {product.total}x {product.sku}
            {product.color ? ` - ${product.color}` : ''}
            {product.size ? ` - ${product.size}` : ''}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
};
