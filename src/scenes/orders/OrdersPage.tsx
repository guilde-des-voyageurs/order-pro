'use client';

import { Title, Text, Loader, Table, Button, Group, Stack } from '@mantine/core';
import { useOrdersPagePresenter } from './OrdersPage.presenter';
import { clsx } from 'clsx';
import { FinancialStatus } from '@/components/FinancialStatus';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import styles from './OrdersPage.module.scss';
import { useEffect } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import type { ShopifyOrder } from '@/types/shopify';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface OrderRowProps {
  order: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  return (
    <Table.Tr 
      key={order.id} 
      className={clsx(styles.tableRow, { [styles.selected]: isSelected })}
      onClick={() => onSelect(order.id)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>{order.name}</Table.Td>
      <Table.Td className={styles.dateCell}>
        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <FinancialStatus status={order.displayFinancialStatus} />
        </Group>
      </Table.Td>
      <Table.Td>
        <TextileProgress orderId={encodeFirestoreId(order.id)} />
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <InvoiceCheckbox orderId={order.id} />
      </Table.Td>
    </Table.Tr>
  );
}

function OrdersSection({ title, orders, selectedOrder, onSelect, type }: { 
  title: string;
  orders: any[];
  selectedOrder: any;
  onSelect: (id: string) => void;
  type: string;
}) {
  return (
    <div className={clsx(styles.section, { [styles.shipped]: type === 'shipped' })}>
      <Stack gap="md">
        <div>
          <Text className={clsx(styles.sectionTitle, {
            [styles.pending]: type === 'pending',
            [styles.shipped]: type === 'shipped'
          })}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            {orders.length} commandes
          </Text>
        </div>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Numéro</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Etat</Table.Th>
              <Table.Th>Avancement</Table.Th>
              <Table.Th>Facturé</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onSelect={onSelect}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </div>
  );
}

export function OrdersPage() {
  const { 
    pendingOrders, 
    shippedOrders, 
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading 
  } = useOrdersPagePresenter();

  useEffect(() => {
    async function initializeProgress(order: any) {
      if (!auth.currentUser || !isDrawerOpen) return;

      // Calculer le nombre total de variants (en excluant les produits annulés)
      const totalCount = order.lineItems?.reduce((acc: number, item: NonNullable<ShopifyOrder['lineItems']>[number]) => {
        // Ne pas compter les produits annulés
        if (item.isCancelled) return acc;
        return acc + item.quantity;
      }, 0) ?? 0;

      // Initialiser le document de progression
      const progressRef = doc(db, 'textile-progress', encodeFirestoreId(order.id));
      await setDoc(progressRef, {
        totalCount,
        checkedCount: 0,
      }, { merge: false });
    }

    if (selectedOrder) {
      initializeProgress(selectedOrder);
    }
  }, [selectedOrder, isDrawerOpen]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Title order={1}>Commandes</Title>

      <OrdersSection
        title="Commandes en cours"
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="pending"
      />

      <OrdersSection
        title="Commandes expédiées"
        orders={shippedOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="shipped"
      />

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
