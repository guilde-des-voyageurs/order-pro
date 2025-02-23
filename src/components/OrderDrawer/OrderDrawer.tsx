'use client';

import { Drawer } from '@mantine/core';
import type { ShopifyOrder } from '@/types/shopify';
import styles from './OrderDrawer.module.scss';
import { OrderDrawerContent } from './OrderDrawerContent';

interface OrderDrawerProps {
  order?: ShopifyOrder;
  opened: boolean;
  onClose: () => void;
}

export function OrderDrawer({ order, opened, onClose }: OrderDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="800px"
      title="Détails de la commande"
      padding="xl"
      styles={{
        header: {
          marginBottom: 0,
          padding: 'var(--mantine-spacing-xl)'
        },
        inner: {
          padding: 0
        }
      }}
      classNames={{ root: styles.drawer }}
    >
      {order && <OrderDrawerContent order={order} />}
    </Drawer>
  );
}
