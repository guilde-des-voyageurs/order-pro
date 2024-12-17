'use client';

import styles from './HomePage.module.scss';
import { clsx } from 'clsx';
import { OrderDetailsSection } from '@/pages/home/OrderDetailsSection';
import { Badge } from '@/components/Badge';
import { Text, Title } from '@mantine/core';
import { useHomePagePresenter } from '@/pages/home/HomePage.presenter';

export const HomePage = () => {
  const { openOrders, closedOrders, selected, setSelected } =
    useHomePagePresenter();

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
        selected={selected}
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      />
    </div>
  );
};
