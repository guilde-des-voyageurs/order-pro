'use client';

import { Drawer } from '@mantine/core';
import type { ShopifyOrder } from '@/types/shopify';
import styles from './OrderDrawer.module.scss';
import { OrderDrawerContent } from './OrderDrawerContent';

interface OrderDrawerProps {
  order: ShopifyOrder | null;
  opened: boolean;
  onClose: () => void;
}

export function OrderDrawer({ order, opened, onClose }: OrderDrawerProps) {
  if (!order) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Commande {order.name}</span>}
      position="right"
      size="lg"
      padding="xl"
      classNames={{ root: styles.drawer }}
    >
      <OrderDrawerContent order={order} />
    </Drawer>
  );
}
