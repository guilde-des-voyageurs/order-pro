'use client';

import { SimpleGrid, Text, Group } from '@mantine/core';
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

  // Trier les variantes pour chaque SKU
  Object.keys(variants).forEach(sku => {
    variants[sku].sort((a, b) => {
      // Trier par couleur d'abord
      const colorA = a.color || 'no-color';
      const colorB = b.color || 'no-color';
      if (colorA !== colorB) {
        return colorA.localeCompare(colorB);
      }
      // Puis par taille
      const sizeA = a.size || 'no-size';
      const sizeB = b.size || 'no-size';
      return sizeA.localeCompare(sizeB);
    });
  });

  // Rendu côté serveur
  if (typeof window === 'undefined') {
    return (
      <SimpleGrid cols={Object.keys(variants).length} spacing="md">
        {Object.entries(variants).map(([sku, variants]) => {
          const groupedVariants = groupVariantsByAttributes(variants);
          
          return (
            <div key={sku} style={{ display: 'flex', flexDirection: 'column' }}>
              <Text size="sm" fw={700} mb={4}>{sku}</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(groupedVariants).map(([key, variants]) => {
                  const firstVariant = variants[0];
                  const quantity = variants.length;

                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ whiteSpace: 'nowrap', color: '#666', display: 'flex', alignItems: 'center' }}>
                        <Text component="span" size="sm">{quantity}x</Text>
                        {firstVariant.color && <Text component="span" size="sm" ml={5}>{transformColor(firstVariant.color)}</Text>}
                        {firstVariant.size && <Text component="span" size="sm" ml={5} fw={700}>{firstVariant.size}</Text>}
                      </div>
                      <div style={{ display: 'flex', margin: 0, padding: 0, paddingLeft: 10 }}>
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
                            <VariantCheckbox
                              key={variantId}
                              sku={variant.sku}
                              color={variant.color}
                              size={variant.size}
                              quantity={1}
                              orderId={variant.orderId}
                              productIndex={variant.productIndex}
                              variantId={variantId}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
          <div key={sku} style={{ display: 'flex', flexDirection: 'column' }}>
            <Text size="sm" fw={700} mb={4}>{sku}</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(groupedVariants).map(([key, variants]) => {
                const firstVariant = variants[0];
                const quantity = variants.length;

                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ whiteSpace: 'nowrap', color: '#666', display: 'flex', alignItems: 'center' }}>
                      <Text component="span" size="sm">{quantity}x</Text>
                      {firstVariant.color && <Text component="span" size="sm" ml={5}>{transformColor(firstVariant.color)}</Text>}
                      {firstVariant.size && <Text component="span" size="sm" ml={5} fw={700}>{firstVariant.size}</Text>}
                    </div>
                    <div style={{ display: 'flex', margin: 0, padding: 0, paddingLeft: 10 }}>
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
                          <VariantCheckbox
                            key={variantId}
                            sku={variant.sku}
                            color={variant.color}
                            size={variant.size}
                            quantity={1}
                            orderId={variant.orderId}
                            productIndex={variant.productIndex}
                            variantId={variantId}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </SimpleGrid>
  );
};
