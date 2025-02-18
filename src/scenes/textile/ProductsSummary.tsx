'use client';

import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';

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

const variantKey = (variant: ProductVariant | GroupedVariant) => 
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
    .filter((entry): entry is [string, OrderDetail] => {
      const [_, detail] = entry;
      return detail?.type === 'success';
    })
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
        // Trier les variantes par couleur et taille
        existingSku.groupedVariants.sort((a, b) => {
          // D'abord trier par couleur
          if (a.color && b.color) {
            const colorCompare = a.color.localeCompare(b.color);
            if (colorCompare !== 0) return colorCompare;
          }
          // Ensuite trier par taille
          if (a.size && b.size) {
            // Convertir les tailles en nombres si possible
            const aSize = parseInt(a.size);
            const bSize = parseInt(b.size);
            if (!isNaN(aSize) && !isNaN(bSize)) {
              return aSize - bSize;
            }
            return a.size.localeCompare(b.size);
          }
          return 0;
        });
      }
      existingSku.totalQuantity = existingSku.groupedVariants.reduce(
        (sum, group) => sum + group.variants.length,
        0
      );
    } else {
      acc.push({
        sku: variant.sku,
        groupedVariants: [{
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          variants: [variant]
        }],
        totalQuantity: 1
      });
    }
    return acc;
  }, []);

  // Trier les SKUs par ordre alphabétique
  productsBySku.sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <Stack mt="md" mb="xl" gap="xs">
      <Grid>
        {productsBySku.map((skuGroup) => (
          <Grid.Col key={skuGroup.sku} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack gap={4}>
              <Text fw={500}>{skuGroup.sku}</Text>
              {skuGroup.groupedVariants.map((variant, index) => (
                <Group key={index} gap={4}>
                  <Text size="sm" c="dimmed">
                    {variant.color && `${variant.color}`}
                    {variant.size && variant.color && ' - '}
                    {variant.size && `${variant.size}`}
                    {' '}({variant.variants.length})
                  </Text>
                  <Group gap={2}>
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
