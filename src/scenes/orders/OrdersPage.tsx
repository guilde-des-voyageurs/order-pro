'use client';

import { Title, Text, Loader, Table, Button, Group } from '@mantine/core';
import { useOrdersPagePresenter } from './OrdersPage.presenter';
import { clsx } from 'clsx';
import { FinancialStatus } from '@/components/FinancialStatus';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import styles from './OrdersPage.module.scss';

interface OrderRowProps {
  order: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  return (
    <Table.Tr 
      key={order.id} 
      className={clsx({ [styles.selected]: isSelected })}
      onClick={() => onSelect(order.id)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>{order.name}</Table.Td>
      <Table.Td>
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
        <TextileProgress orderId={order.id} />
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <InvoiceCheckbox orderId={order.id} />
      </Table.Td>
    </Table.Tr>
  );
}

function OrdersSection({ title, orders, selectedOrder, onSelect }: { 
  title: string;
  orders: any[];
  selectedOrder: any;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.section}>
      <Title order={4}>{title}</Title>
      <Text size="sm" c="dimmed" className={styles.section_subtitle}>
        {orders.length} commandes
      </Text>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Numéro</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Statut</Table.Th>
            <Table.Th>Textile</Table.Th>
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

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Title order={1}>Commandes</Title>
      <Text size="sm" c="dimmed" className={styles.section_subtitle}>
        {pendingOrders.length + shippedOrders.length} commandes synchronisées
      </Text>

      <OrdersSection
        title="Commandes en cours"
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
      />

      <OrdersSection
        title="Commandes expédiées"
        orders={shippedOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
      />

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
