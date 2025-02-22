'use client';

import styles from './OrdersPage.module.scss';
import { Title, Text, Loader } from '@mantine/core';
import { useOrdersPagePresenter } from './OrdersPage.presenter';
import { clsx } from 'clsx';
import { OrderStatus } from '@/components/OrderStatus';
import { FinancialStatus } from '@/components/FinancialStatus';

interface OrderRowProps {
  order: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  return (
    <div
      key={order.id}
      className={clsx(styles.row, {
        [styles.selected]: isSelected,
      })}
      onClick={() => onSelect(order.id)}
    >
      <Text className={styles.order_number}>{order.name}</Text>
      <div className={styles.status}>
        <OrderStatus orderId={order.id} status={order.displayFulfillmentStatus} />
      </div>
      <div className={styles.status}>
        <FinancialStatus status={order.displayFinancialStatus} />
      </div>
      <Text className={styles.date}>
        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </div>
  );
}

function OrdersSection({ title, orders, selected, onSelect }: { 
  title: string;
  orders: any[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.section}>
      <Title order={3}>{title}</Title>
      <Text size="sm" c="dimmed" className={styles.section_subtitle}>
        {orders.length} commandes
      </Text>

      <div className={styles.row_headers}>
        <Text className={styles.order_number}>Numéro</Text>
        <Text className={styles.status}>Statut</Text>
        <Text className={styles.status}>Paiement</Text>
        <Text className={styles.date}>Date de création</Text>
      </div>

      <div className={styles.rows}>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            isSelected={selected === order.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { pendingOrders, shippedOrders, selected, setSelected, isLoading } = useOrdersPagePresenter();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Title order={2}>Commandes</Title>
      <Text size="sm" c="dimmed" className={styles.section_subtitle}>
        {pendingOrders.length + shippedOrders.length} commandes synchronisées
      </Text>

      <OrdersSection
        title="Commandes en cours"
        orders={pendingOrders}
        selected={selected}
        onSelect={setSelected}
      />

      <OrdersSection
        title="Commandes expédiées"
        orders={shippedOrders}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  );
}
