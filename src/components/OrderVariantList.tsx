'use client';

import { Group, Stack, Text, Box } from '@mantine/core';
import { VariantCheckbox } from './VariantCheckbox';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useHasMounted } from '@/hooks/useHasMounted';
import styles from '@/scenes/home/OrderDetailsSection.module.scss';
import { transformColor } from '@/utils/color-transformer';
import { Product, Variant, productToVariants, generateVariantId, groupVariantsByAttributes } from '@/utils/variants';

interface OrderVariantListProps {
  orderId: string;
  products: Product[];
}

export const OrderVariantList = ({ orderId, products }: OrderVariantListProps) => {
  const hasMounted = useHasMounted();
  const [progress, setProgress] = useState({ checkedCount: 0, totalCount: 0 });

  useEffect(() => {
    if (!auth.currentUser || !hasMounted) return;

    // Calculer le nombre total de variantes
    const total = products.reduce((acc, product) => acc + product.quantity, 0);

    // Initialiser ou mettre à jour le totalCount dans Firestore
    const encodedOrderId = encodeFirestoreId(orderId);
    const orderRef = doc(db, 'orders-progress', encodedOrderId);
    setDoc(orderRef, {
      totalCount: total,
      userId: auth.currentUser.uid,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Écouter les changements du compteur de la commande
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setProgress(prev => ({ 
          ...prev, 
          checkedCount: doc.data()?.checkedCount || 0,
          totalCount: doc.data()?.totalCount || 0
        }));
      }
    });

    return () => unsubscribe();
  }, [orderId, products, hasMounted]);

  // Transformer les produits en variantes
  const allVariants = products.flatMap((product, productIndex) => 
    productToVariants(product, productIndex, orderId)
  );

  // Grouper les variantes par attributs
  const groupedVariants = groupVariantsByAttributes(allVariants);

  // Rendu côté serveur
  if (typeof window === 'undefined') {
    return (
      <Stack>
        <Box p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
          <Text size="sm" mb={2} fw={600} c="dimmed">
            Textile commandé : Chargement...
          </Text>
          {Object.entries(groupedVariants).map(([key, variants]) => {
            const firstVariant = variants[0];
            const quantity = variants.length;

            return (
              <Stack key={key}>
                <Group>
                  <Text size="sm">{quantity}x</Text>
                  <Text size="sm">{firstVariant.sku}</Text>
                  {firstVariant.color && <Text size="sm">{transformColor(firstVariant.color)}</Text>}
                  {firstVariant.size && <Text size="sm">{firstVariant.size}</Text>}
                </Group>
              </Stack>
            );
          })}
        </Box>
      </Stack>
    );
  }

  // Rendu côté client
  return (
    <Stack>
      <Box p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
        <Text size="sm" mb={2} fw={600} c="dimmed">
          Textile commandé : {progress.checkedCount} / {progress.totalCount}
        </Text>
        {Object.entries(groupedVariants).map(([key, variants]) => {
          const firstVariant = variants[0];
          const quantity = variants.length;

          return (
            <Stack key={key}>
              <Group>
                <Text size="sm">{quantity}x</Text>
                <Text size="sm">{firstVariant.sku}</Text>
                {firstVariant.color && <Text size="sm">{transformColor(firstVariant.color)}</Text>}
                {firstVariant.size && <Text size="sm">{firstVariant.size}</Text>}
              </Group>
              <Stack ml="sm">
                {variants.map((variant, index) => {
                  const variantId = generateVariantId(
                    orderId,
                    variant.sku,
                    variant.color,
                    variant.size,
                    variant.productIndex,
                    variant.variantIndex,
                    products
                  );

                  return (
                    <Group key={variantId}>
                      <VariantCheckbox
                        sku={variant.sku}
                        color={variant.color}
                        size={variant.size}
                        quantity={1}
                        orderId={orderId}
                        productIndex={variant.productIndex}
                        variantId={variantId}
                      />
                    </Group>
                  );
                })}
              </Stack>
            </Stack>
          );
        })}
      </Box>
    </Stack>
  );
};
