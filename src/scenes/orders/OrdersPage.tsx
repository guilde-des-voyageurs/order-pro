'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper } from '@mantine/core';
import { useOrdersPagePresenter } from './OrdersPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { formatAmount } from '@/utils/format-helpers';
import styles from './OrdersPage.module.scss';
import { useEffect } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';
import type { ShopifyOrder } from '@/types/shopify';

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
        <DaysElapsed 
          createdAt={order.createdAt} 
          isFulfilled={order.displayFulfillmentStatus === 'FULFILLED'} 
        />
      </Table.Td>
      <Table.Td>
        <TextileProgress orderId={encodeFirestoreId(order.id)} />
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <InvoiceCheckbox 
          orderId={order.id} 
          totalAmount={order.lineItems?.reduce((total, item) => 
            total + (item.isCancelled ? 0 : (item.unitCost * item.quantity)),
            0
          ) ?? 0}
          currency={order.totalPriceCurrency}
        />
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
        <Paper withBorder style={{ maxWidth: 1100 }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Numéro</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>En attente depuis</Table.Th>
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
        </Paper>
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
    const initializeProgress = async (order: ShopifyOrder) => {
      const orderId = encodeFirestoreId(order.id);
      const progressRef = doc(db, 'textile-progress', orderId);
      
      // Calculer le nombre total de variantes non annulées
      const totalCount = order.lineItems?.reduce((total, item) => 
        total + (item.isCancelled ? 0 : item.quantity),
        0
      ) ?? 0;

      // Préparer toutes les promesses de vérification des variantes
      const variantPromises = order.lineItems?.flatMap(item => {
        if (item.isCancelled) return [];
        
        const color = item.variantTitle?.split(' / ')[0] || '';
        const size = item.variantTitle?.split(' / ')[1] || '';
        
        return Array.from({ length: item.quantity }).map((_, i) => {
          const variantId = generateVariantId(orderId, item.sku || '', color, size, i);
          return getDoc(doc(db, 'variants', variantId));
        });
      }) ?? [];

      // Exécuter toutes les promesses en parallèle
      try {
        const variantDocs = await Promise.all(variantPromises);
        const checkedCount = variantDocs.filter(doc => doc.exists() && doc.data()?.checked).length;

        // Mettre à jour le document de progression
        await setDoc(progressRef, {
          totalCount,
          checkedCount,
        }, { merge: true });
      } catch (error) {
        console.error('Error initializing progress:', error);
      }
    };

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
