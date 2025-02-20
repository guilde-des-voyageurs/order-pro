'use client';

import { Stack, Text, Grid, Paper, Group, Checkbox } from '@mantine/core';
import { useMemo } from 'react';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { generateVariantId } from '@/utils/variant-helpers';

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

interface VariantsSummaryGridProps {
  orderDetails: Record<string, OrderDetail>;
}

interface VariantInfo {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderIds: Array<{
    orderId: string;
    productIndex: number;
  }>;
}

interface VariantCheckboxProps {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderId: string;
  productIndex: number;
  variantId: string;
}

export const VariantsSummaryGrid = ({ orderDetails }: VariantsSummaryGridProps) => {
  const variantsBySku = useMemo(() => {
    const variants: Record<string, VariantInfo[]> = {};
    
    // Collect all variants
    Object.entries(orderDetails).forEach(([orderId, detail]) => {
      if (detail.type === 'success') {
        detail.data.products.forEach((product, productIndex) => {
          const color = product.selectedOptions.find(opt => opt.name === 'Couleur')?.value || 'no-color';
          const size = product.selectedOptions.find(opt => opt.name === 'Taille')?.value || 'no-size';
          
          if (!variants[product.sku]) {
            variants[product.sku] = [];
          }
          
          // Check if variant already exists
          const existingVariant = variants[product.sku].find(
            v => v.color === color && v.size === size
          );
          
          if (existingVariant) {
            existingVariant.quantity += product.quantity;
            // Ne pas ajouter d'autres orderIds, on garde celui d'origine
          } else {
            variants[product.sku].push({
              sku: product.sku,
              color,
              size,
              quantity: product.quantity,
              orderIds: [{ orderId, productIndex }]
            });
          }
        });
      }
    });
    
    // Sort variants for each SKU
    Object.keys(variants).forEach(sku => {
      variants[sku].sort((a, b) => {
        // Sort by color first
        if (a.color !== b.color) {
          return a.color.localeCompare(b.color);
        }
        // Then by size
        return a.size.localeCompare(b.size);
      });
    });
    
    return variants;
  }, [orderDetails]);
  
  const skus = Object.keys(variantsBySku).sort();
  
  if (skus.length === 0) {
    return <Text>Aucune variante trouvée</Text>;
  }
  
  return (
    <Paper p="md" mb="xl" withBorder>
      <Grid>
        {skus.map((sku) => (
          <Grid.Col key={sku} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack>
              <Text fw={700}>{sku}</Text>
              {variantsBySku[sku].map((variant) => {
                const { orderId, productIndex } = variant.orderIds[0];
                const detail = orderDetails[orderId];
                
                return (
                  <Stack key={`${variant.color}-${variant.size}`} spacing="xs">
                    <Text size="sm">
                      {variant.color} - {variant.size} ({variant.quantity})
                    </Text>
                    <Stack spacing={4} ml="sm">
                      {Array.from({ length: variant.quantity }).map((_, index) => {
                        const variantId = generateVariantId(
                          orderId,
                          variant.sku,
                          variant.color,
                          variant.size,
                          productIndex,
                          index,
                          detail.type === 'success' ? detail.data.products : undefined
                        );
                        
                        return (
                          <Group key={variantId} spacing="xs" align="center">
                            <Group spacing={4}>
                              <Text size="xs" c="dimmed">#{index + 1}</Text>
                              <VariantCheckbox
                                sku={variant.sku}
                                color={variant.color}
                                size={variant.size}
                                quantity={1}
                                orderId={orderId}
                                productIndex={productIndex}
                                variantId={variantId}
                              />
                            </Group>
                            <Text size="xs" c="dimmed">
                              ({variantId})
                            </Text>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
};
