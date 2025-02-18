'use client';

import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';
import styles from './TextilePage.module.scss';

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
}

interface GroupedVariant {
  sku: string;
  color?: string;
  size?: string;
  variants: ProductVariant[];
}

interface ProductGroup {
  sku: string;
  groupedVariants: GroupedVariant[];
  totalQuantity: number;
}

const variantKey = (variant: ProductVariant) => 
  `${variant.sku}--${variant.color || 'no-color'}--${variant.size || 'no-size'}`;

export const ProductsSummary = ({ orderDetails }: ProductsSummaryProps) => {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return (
      <Stack mt="md" mb="xl">
        <Title order={3}>Total des produits commandés</Title>
        <Text size="sm" color="dimmed">Chargement...</Text>
      </Stack>
    );
  }

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

  // Regrouper par SKU et sous-grouper par variantes identiques
  const productsBySku = allVariants.reduce((acc: ProductGroup[], variant) => {
    const existingSku = acc.find(p => p.sku === variant.sku);
    const variantIdentifier = variantKey(variant);
    
    if (existingSku) {
      const existingVariantGroup = existingSku.groupedVariants.find(
        v => variantKey(v) === variantIdentifier
      );

      if (existingVariantGroup) {
        existingVariantGroup.variants.push(variant);
      } else {
        existingSku.groupedVariants.push({
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          variants: [variant]
        });
      }
      existingSku.totalQuantity += variant.quantity;
    } else {
      acc.push({
        sku: variant.sku,
        groupedVariants: [{
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          variants: [variant]
        }],
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
              {skuGroup.groupedVariants
                .sort((a, b) => b.variants.length - a.variants.length)
                .map((groupedVariant) => (
                  <Stack key={variantKey(groupedVariant)} spacing={4}>
                    <Text size="sm" fw={500}>
                      {groupedVariant.sku}
                      {groupedVariant.color ? ` - ${groupedVariant.color}` : ''}
                      {groupedVariant.size ? ` - ${groupedVariant.size}` : ''}
                      {' '}({groupedVariant.variants.length} unité{groupedVariant.variants.length > 1 ? 's' : ''})
                    </Text>
                    <Group gap={4}>
                      {groupedVariant.variants
                        .sort((a, b) => a.orderId.localeCompare(b.orderId))
                        .map((variant, index) => (
                          <VariantCheckbox
                            key={`${variant.orderId}-${index}`}
                            sku={variant.sku}
                            color={variant.color}
                            size={variant.size}
                            quantity={variant.quantity}
                            orderId={encodeFirestoreId(variant.orderId)}
                          />
                        ))}
                    </Group>
                  </Stack>
                ))}
            </Stack>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
};
