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
          variants: [variant],
        });
        // Trier les variantes par couleur puis par taille
        existingSku.groupedVariants.sort((a, b) => {
          // D'abord par couleur
          const colorCompare = (a.color || '').localeCompare(b.color || '');
          if (colorCompare !== 0) return colorCompare;

          // Ensuite par taille (avec un tri spécial pour les tailles standard)
          const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 };
          const aSize = a.size || '';
          const bSize = b.size || '';
          const aOrder = sizeOrder[aSize as keyof typeof sizeOrder] || 99;
          const bOrder = sizeOrder[bSize as keyof typeof sizeOrder] || 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          
          return aSize.localeCompare(bSize);
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
          variants: [variant],
        }],
        totalQuantity: variant.quantity,
      });
    }
    return acc;
  }, [])
  .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return (
    <Stack mt="md" mb="xl">
      <Grid>
        {productsBySku.map((skuGroup) => (
          <Grid.Col key={skuGroup.sku} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack gap="xs">
              <Text fw={500}>{skuGroup.sku}</Text>
              {skuGroup.groupedVariants.map((variant, index) => (
                <Group key={index} gap="xs">
                  <Text size="sm" c="dimmed">
                    {variant.color && `${variant.color}`}
                    {variant.size && variant.color && ' - '}
                    {variant.size && `${variant.size}`}
                    {' '}({variant.variants.length})
                  </Text>
                  <Group gap={4}>
                    {variant.variants.map((v, i) => (
                      <VariantCheckbox
                        key={`${v.orderId}-${i}`}
                        orderId={v.orderId}
                        sku={v.sku}
                        color={v.color || null}
                        size={v.size || null}
                        quantity={1}
                      />
                    ))}
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
