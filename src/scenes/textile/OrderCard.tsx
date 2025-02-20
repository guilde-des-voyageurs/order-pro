'use client';

import { Group, Stack, Text, Title, Card } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import { IconCheck } from '@tabler/icons-react';
import styles from './TextilePage.module.scss';
import { useHasMounted } from '@/hooks/useHasMounted';

interface Product {
  quantity: number;
  sku: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface OrderDetailSuccess {
  type: 'success';
  data: {
    id: string;
    name: string;
    products: Product[];
  };
}

interface OrderCardProps {
  order: {
    id: string;
    name: string;
  };
  orderDetail?: OrderDetailSuccess;
}

export const OrderCard = ({ order, orderDetail }: OrderCardProps) => {
  const hasMounted = useHasMounted();
  const [progress, setProgress] = useState({ checkedCount: 0, totalCount: 0 });

  const getOptionValue = (product: Product, optionName: string): string | null => {
    const value = product.selectedOptions.find(
      opt => opt.name.toLowerCase().includes(optionName.toLowerCase())
    )?.value;
    return value ?? null;
  };

  useEffect(() => {
    if (!auth.currentUser || orderDetail?.type !== 'success' || !hasMounted) return;

    // Calculer le nombre total de variantes
    const total = orderDetail.data.products.reduce((acc, product) => acc + product.quantity, 0);
    setProgress(prev => ({ ...prev, totalCount: total }));

    // Écouter les changements du compteur de la commande
    const encodedOrderId = encodeFirestoreId(order.id);
    const orderRef = doc(db, 'orders-progress', encodedOrderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setProgress(prev => ({ 
          ...prev, 
          checkedCount: doc.data()?.checkedCount || 0 
        }));
      }
    });

    return () => unsubscribe();
  }, [order.id, orderDetail, hasMounted]);

  const isComplete = progress.totalCount > 0 && progress.checkedCount === progress.totalCount;

  if (!hasMounted) {
    return (
      <Card withBorder className={styles.order_row}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Title order={3}>Commande {order.name}</Title>
            <Group gap="xs">
              <Text size="sm" color="dimmed">
                Chargement...
              </Text>
            </Group>
          </Group>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder className={styles.order_row}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Title order={3}>Commande {order.name}</Title>
          <Group gap="xs">
            {isComplete ? (
              <Text className={styles.progress_complete}>
                <IconCheck size={16} stroke={3} />
                {progress.checkedCount}/{progress.totalCount}
              </Text>
            ) : (
              <Text size="sm" color="dimmed">
                {progress.checkedCount}/{progress.totalCount}
              </Text>
            )}
          </Group>
        </Group>

        {orderDetail?.type === 'success' && (
          <Stack gap="xs" mt="md">
            {orderDetail.data.products.map((product, productIndex) => {
              const color = getOptionValue(product, 'couleur');
              const size = getOptionValue(product, 'taille');
              
              // Calculer l'index global pour cette variante
              const variantKey = `${product.sku}--${color || 'no-color'}--${size || 'no-size'}`;
              const globalIndex = orderDetail.data.products
                .slice(0, productIndex)
                .filter(p => {
                  const pColor = getOptionValue(p, 'couleur');
                  const pSize = getOptionValue(p, 'taille');
                  const pKey = `${p.sku}--${pColor || 'no-color'}--${pSize || 'no-size'}`;
                  return pKey === variantKey;
                })
                .length;
              
              return (
                <Group key={productIndex}>
                  <Group gap="sm">
                    <VariantCheckbox
                      sku={product.sku}
                      color={color}
                      size={size}
                      quantity={product.quantity}
                      orderId={encodeFirestoreId(order.id)}
                      productIndex={globalIndex}
                    />
                    <Text component="span" size="sm">
                      {product.quantity}x {product.sku}
                      {color ? ` - ${color}` : ''}
                      {size ? ` - ${size}` : ''}
                    </Text>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};
