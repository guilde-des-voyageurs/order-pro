'use client';

import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { encodeFirestoreId } from '@/utils/firestore-helpers';

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

interface ProductVariant {
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  orderId: string;
  orderName?: string;
}

interface ProductGroup {
  sku: string;
  variants: ProductVariant[];
  totalQuantity: number;
}

export const ProductsSummary = ({ orderDetails }: ProductsSummaryProps) => {
  // Transformer les produits en gardant les variantes séparées par commande
  const allVariants = Object.entries(orderDetails)
    .filter(([_, detail]): detail is [string, OrderDetail] => detail?.type === 'success')
    .flatMap(([orderId, detail]) => 
      detail.data.products.flatMap(product => {
        const color = product.selectedOptions.find(
          opt => opt.name.toLowerCase().includes('couleur')
        )?.value;
        const size = product.selectedOptions.find(
          opt => opt.name.toLowerCase().includes('taille')
        )?.value;

        // Créer une variante pour chaque unité du produit
        return Array(product.quantity).fill(null).map(() => ({
          sku: product.sku,
          color,
          size,
          quantity: 1,
          orderId,
        }));
      })
    );

  // Regrouper par SKU pour l'affichage
  const productsBySku = allVariants.reduce((acc: ProductGroup[], variant) => {
    const existingSku = acc.find(p => p.sku === variant.sku);
    
    if (existingSku) {
      existingSku.variants.push(variant);
      existingSku.totalQuantity += variant.quantity;
    } else {
      acc.push({
        sku: variant.sku,
        variants: [variant],
        totalQuantity: variant.quantity
      });
    }
    
    return acc;
  }, [])
  .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return (
    <Stack mt="md" mb="xl">
      <Title order={3}>Total des produits commandés</Title>
      <Grid>
        {productsBySku.map((skuGroup) => (
          <Grid.Col key={skuGroup.sku} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack>
              <Title order={4}>{skuGroup.sku} (Total: {skuGroup.totalQuantity})</Title>
              {skuGroup.variants.map((variant, index) => (
                <Group key={`${variant.orderId}-${index}`} gap="sm">
                  <Group align="center" gap="xs">
                    <VariantCheckbox 
                      sku={variant.sku}
                      color={variant.color}
                      size={variant.size}
                      quantity={variant.quantity}
                      orderId={encodeFirestoreId(variant.orderId)}
                    />
                    <Text component="span" size="sm">
                      {variant.sku}
                      {variant.color ? ` - ${variant.color}` : ''}
                      {variant.size ? ` - ${variant.size}` : ''}
                      {' '}<Text span c="dimmed">({variant.orderId})</Text>
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
