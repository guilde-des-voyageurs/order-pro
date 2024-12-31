'use client';

import styles from './HomePage.module.scss';
import { clsx } from 'clsx';
import { OrderDetailsSection } from '@/scenes/home/OrderDetailsSection';
import { Badge } from '@/components/Badge';
import { Text, Title } from '@mantine/core';
import { useHomePagePresenter } from '@/scenes/home/HomePage.presenter';

export const HomePage = () => {
  const {
    openOrders,
    closedOrders,
    selected,
    setSelected,
    openOrderQuantityPerTypeStr,
  } = useHomePagePresenter();

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Commandes à la demande</Title>
        <section className={styles.section}>
          <Badge variant={'orange'}>En cours ({openOrders.length})</Badge>
          <Text className={styles.section_subtitle}>
            <b>Total</b> : {openOrderQuantityPerTypeStr}
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
          <Badge variant={'green'}>Traitées ({closedOrders.length})</Badge>
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
