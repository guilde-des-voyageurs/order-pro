'use client';

import styles from './HomePage.module.scss';
import { clsx } from 'clsx';
import { useState } from 'react';
import { OrderDetailsSection } from '@/pages/home/OrderDetailsSection';
import { Badge } from '@/components/Badge';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersAction } from '@/actions/fetch-orders-action';
import { Text, Title } from '@mantine/core';

export const HomePage = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersAction(),
  });

  const openOrders = (query.data ?? []).filter(
    (order) => order.status === 'OPEN',
  );

  const closedOrders = (query.data ?? []).filter(
    (order) => order.status !== 'OPEN',
  );

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Commandes à la demande</Title>
        <section className={styles.section}>
          <Badge variant={'orange'}>En cours (2)</Badge>
          <Text className={styles.section_subtitle}>
            Total : 2 Creator, 1 Drummer
          </Text>
          <div className={styles.rows}>
            {openOrders.map((order) => (
              <div
                key={order.id}
                className={clsx(
                  styles.row,
                  selected === order.id && styles.row_active,
                )}
                onClick={() => setSelected(order.id)}
              >
                <Text className={styles.row_id}>{order.name}</Text>
                <Text className={styles.row_date}>
                  {order.createdAtFormatted}
                </Text>
                <Text className={styles.row_quantity}>
                  {order.quantity} article(s) à la demande
                </Text>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <Badge variant={'green'}>Traitées (2)</Badge>
          <div className={styles.rows}>
            {closedOrders.map((order) => (
              <div
                key={order.id}
                className={clsx(
                  styles.row,
                  selected === order.id && styles.row_active,
                )}
                onClick={() => setSelected(order.id)}
              >
                <Text className={styles.row_id}>{order.name}</Text>
                <Text className={styles.row_date}>
                  {order.createdAtFormatted}
                </Text>
                <Text className={styles.row_quantity}>
                  {order.quantity} article(s) à la demande
                </Text>
              </div>
            ))}
          </div>
        </section>
      </div>
      <OrderDetailsSection
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      />
    </div>
  );
};
