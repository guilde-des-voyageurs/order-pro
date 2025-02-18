'use client';

import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';

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

interface ProductsBySku {
  sku: string;
  variants: ProductTotal[];
  totalQuantity: number;
}

export const ProductsSummary = ({ orderDetails }: ProductsSummaryProps) => {
  // Agréger les quantités par produit (SKU + couleur + taille)
  const allProducts = Object.values(orderDetails)
    .filter((detail): detail is OrderDetail => detail?.type === 'success')
    .flatMap(detail => detail.data.products)
    .reduce((acc: ProductTotal[], product) => {
      const color = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('couleur')
      )?.value;
      const size = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('taille')
      )?.value;

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
    }, []);

  // Regrouper par SKU
  const productsBySku = allProducts.reduce((acc: ProductsBySku[], product) => {
    const existingSku = acc.find(p => p.sku === product.sku);
    
    if (existingSku) {
      existingSku.variants.push(product);
      existingSku.totalQuantity += product.total;
    } else {
      acc.push({
        sku: product.sku,
        variants: [product],
        totalQuantity: product.total
      });
    }
    
    return acc;
  }, [])
  .sort((a, b) => b.totalQuantity - a.totalQuantity); // Trier par quantité totale décroissante

  return (
    <Stack mt="md" mb="xl">
      <Title order={3}>Total des produits commandés</Title>
      <Grid>
        {productsBySku.map((skuGroup) => (
          <Grid.Col key={skuGroup.sku} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack>
              <Title order={4}>{skuGroup.sku} (Total: {skuGroup.totalQuantity})</Title>
              {skuGroup.variants
                .sort((a, b) => b.total - a.total)
                .map((variant, index) => (
                  <Group key={index} gap="sm">
                    <Group align="center" gap="xs">
                      <VariantCheckbox 
                        sku={variant.sku}
                        color={variant.color}
                        size={variant.size}
                        quantity={variant.total}
                      />
                      <Text size="sm">
                        {variant.total}x {variant.sku}
                        {variant.color ? ` - ${variant.color}` : ''}
                        {variant.size ? ` - ${variant.size}` : ''}
                      </Text>
                    </Group>
                  </Group>
                ))}
            </Stack>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
};
