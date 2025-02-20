'use client';

import { SimpleGrid, Stack, Text, Group } from '@mantine/core';
import { useMemo } from 'react';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { Product, Variant, generateVariantId, getProductColor, getProductSize, productToVariants, groupVariantsByAttributes, transformColor } from '@/utils/variants';

interface VariantsSummaryGridProps {
  orderDetails: Record<string, {
    type: 'success';
    data: {
      products: Product[];
    };
  }>;
}

export const VariantsSummaryGrid = ({ orderDetails }: VariantsSummaryGridProps) => {
  // Collecter toutes les variantes par SKU
  const variants: Record<string, Variant[]> = {};

  // Collecter toutes les variantes
  Object.entries(orderDetails).forEach(([orderId, detail]) => {
    if (detail.type === 'success') {
      detail.data.products.forEach((product, productIndex) => {
        const newVariants = productToVariants(product, productIndex, orderId);
        const key = product.sku;
        
        if (!variants[key]) {
          variants[key] = [];
        }
        
        variants[key].push(...newVariants);
      });
    }
  });

  // Rendu côté serveur
  if (typeof window === 'undefined') {
    return (
      <SimpleGrid cols={Object.keys(variants).length} spacing="md">
        {Object.entries(variants).map(([sku, variants]) => {
          const groupedVariants = groupVariantsByAttributes(variants);
          
          return (
            <Stack key={sku} spacing="xs">
              <Text size="sm" fw={500}>{sku}</Text>
              {Object.entries(groupedVariants).map(([key, variants]) => {
                const firstVariant = variants[0];
                const quantity = variants.length;

                return (
                  <Stack key={key} spacing={4}>
                    <Group spacing={4}>
                      <Text size="sm">{quantity}x</Text>
                      {firstVariant.color && <Text size="sm">{transformColor(firstVariant.color)}</Text>}
                      {firstVariant.size && <Text size="sm">{firstVariant.size}</Text>}
                    </Group>
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </SimpleGrid>
    );
  }

  // Rendu côté client
  return (
    <SimpleGrid cols={Object.keys(variants).length} spacing="md">
      {Object.entries(variants).map(([sku, variants]) => {
        const groupedVariants = groupVariantsByAttributes(variants);
        
        return (
          <Stack key={sku} spacing="xs">
            <Text size="sm" fw={500}>{sku}</Text>
            {Object.entries(groupedVariants).map(([key, variants]) => {
              const firstVariant = variants[0];
              const quantity = variants.length;

              return (
                <Stack key={key} spacing={4}>
                  <Group spacing={4}>
                    <Text size="sm">{quantity}x</Text>
                    {firstVariant.color && <Text size="sm">{transformColor(firstVariant.color)}</Text>}
                    {firstVariant.size && <Text size="sm">{firstVariant.size}</Text>}
                  </Group>
                  <Stack spacing={4} ml="sm">
                    {variants.map((variant, index) => {
                      const variantId = generateVariantId(
                        variant.orderId,
                        variant.sku,
                        variant.color,
                        variant.size,
                        variant.productIndex,
                        variant.variantIndex,
                        orderDetails[variant.orderId]?.type === 'success' 
                          ? orderDetails[variant.orderId].data.products 
                          : undefined
                      );

                      return (
                        <Group key={variantId} spacing="xs">
                          <Group spacing={4}>
                            <Text size="xs" c="dimmed">#{index + 1}</Text>
                            <VariantCheckbox
                              sku={variant.sku}
                              color={variant.color}
                              size={variant.size}
                              quantity={1}
                              orderId={variant.orderId}
                              productIndex={variant.productIndex}
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
        );
      })}
    </SimpleGrid>
  );
};
