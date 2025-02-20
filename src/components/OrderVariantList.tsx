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
import { calculateGlobalVariantIndex } from '@/utils/variant-helpers';

interface OrderVariantListProps {
  orderId: string;
  products: Array<{
    sku: string;
    quantity: number;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  }>;
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

  if (!hasMounted) {
    return (
      <Stack>
        <Box p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
          <Text size="sm" mb={2} fw={600} c="dimmed">
            Textile commandé : Chargement...
          </Text>
        </Box>
      </Stack>
    );
  }

  // Transformer les produits en gardant les variantes séparées
  const groupedProducts = products.reduce((acc, product) => {
    const color = product.selectedOptions.find(
      opt => opt.name.toLowerCase().includes('couleur')
    )?.value;
    const size = product.selectedOptions.find(
      opt => opt.name.toLowerCase().includes('taille')
    )?.value;

    const key = `${product.sku}--${color || 'no-color'}--${size || 'no-size'}`;
    
    if (!acc[key]) {
      acc[key] = {
        sku: product.sku,
        color,
        size,
        quantity: 0,
        variants: [],
        globalStartIndex: 0 // Index de départ pour ce groupe
      };
    }

    // Créer une variante pour chaque unité du produit
    Array(product.quantity).fill(null).forEach(() => {
      acc[key].variants.push({
        sku: product.sku,
        color,
        size,
        quantity: 1,
      });
    });
    acc[key].quantity += product.quantity;

    return acc;
  }, {} as Record<string, any>);

  // Calculer l'index global de départ pour chaque groupe
  let currentIndex = 0;
  Object.values(groupedProducts).forEach((group: any) => {
    group.globalStartIndex = currentIndex;
    currentIndex += group.variants.length;
  });

  return (
    <Stack>
      <Box p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
        <Text size="sm" mb={2} fw={600} c={progress.checkedCount === progress.totalCount ? 'green' : 'dimmed'}>
          Textile commandé : {progress.checkedCount}/{progress.totalCount}
        </Text>
        {Object.values(groupedProducts).map((group: any) => (
          <Stack key={group.sku}>
            <Group gap="xs" align="center">
              <Group gap={4}>
                {group.variants.map((variant: any, index: number) => {
                  const product = products.find(p => p.sku === variant.sku);
                  const productIndex = products.findIndex(p => p.sku === variant.sku);
                  
                  if (!product || productIndex === -1) return null;
                  
                  const globalIndex = calculateGlobalVariantIndex(
                    products,
                    product,
                    productIndex
                  );

                  return (
                    <VariantCheckbox
                      key={`${orderId}-${variant.sku}-${variant.color}-${variant.size}-${globalIndex}`}
                      orderId={encodeFirestoreId(orderId)}
                      sku={variant.sku}
                      color={variant.color}
                      size={variant.size}
                      quantity={1}
                      productIndex={globalIndex}
                    />
                  );
                })}
              </Group>
              <Text size="sm" fw={500}>
                {group.sku}
                {group.color && ` - ${transformColor(group.color)}`}
                {group.size && ` - ${group.size}`}
                {' '}({group.quantity})
              </Text>
            </Group>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};
