'use client';

import { Group, Stack, Text, Title, Card } from '@mantine/core';
import { OrderCheckbox } from '@/components/OrderCheckbox';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore-helpers';
import styles from './TextilePage.module.scss';

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
  const [progress, setProgress] = useState({ checkedCount: 0, totalCount: 0 });

  const getOptionValue = (product: Product, optionName: string) => {
    return product.selectedOptions.find(
      opt => opt.name.toLowerCase().includes(optionName.toLowerCase())
    )?.value;
  };

  useEffect(() => {
    if (!auth.currentUser || !orderDetail?.type === 'success') return;

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
  }, [order.id, orderDetail]);

  return (
    <Card withBorder className={styles.order_row}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Title order={3}>Commande {order.name}</Title>
          <Group gap="xs">
            <Text size="sm" color="dimmed">
              Progression : {progress.checkedCount}/{progress.totalCount}
            </Text>
            <Text size="sm" color="dimmed">Textile commandé</Text>
            <OrderCheckbox orderId={order.id} className={styles.checkbox_label} />
          </Group>
        </Group>

        {orderDetail?.type === 'success' && (
          <Stack gap="xs" mt="md">
            {orderDetail.data.products.map((product, index) => {
              const color = getOptionValue(product, 'couleur');
              const size = getOptionValue(product, 'taille');
              
              return (
                <Group key={index}>
                  <Group gap="sm">
                    <VariantCheckbox
                      sku={product.sku}
                      color={color}
                      size={size}
                      quantity={product.quantity}
                      orderId={encodeFirestoreId(order.id)}
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
