'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper } from '@mantine/core';
import { useDetailedOrdersPagePresenter } from './DetailedOrdersPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { FinancialStatus } from '@/components/FinancialStatus';
import styles from './DetailedOrdersPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import type { ShopifyOrder } from '@/types/shopify';

interface OrderRowProps {
  order: ShopifyOrder;
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
      <Table.Td>
        <FinancialStatus status={order.displayFinancialStatus} />
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <InvoiceCheckbox orderId={encodeFirestoreId(order.id)} />
      </Table.Td>
    </Table.Tr>
  );
}

function OrdersSection({ title, orders, selectedOrder, onSelect, type }: { 
  title: string;
  orders: ShopifyOrder[];
  selectedOrder: ShopifyOrder | undefined;
  onSelect: (id: string) => void;
  type: string;
}) {
  return (
    <div className={styles.section}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>{title}</Title>
          <Text size="sm" c="dimmed">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </Text>
        </Group>

        <Paper shadow="xs" p="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Numéro</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>En attente depuis</Table.Th>
                <Table.Th>Avancement</Table.Th>
                <Table.Th>Statut</Table.Th>
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

export function DetailedOrdersPage() {
  const { 
    pendingOrders, 
    shippedOrders, 
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading 
  } = useDetailedOrdersPagePresenter();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Title order={1}>Commandes détaillées</Title>

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
