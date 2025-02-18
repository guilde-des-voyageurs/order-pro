'use client';

import styles from './TextilePage.module.scss';
import { Stack, Text, Title } from '@mantine/core';
import { useTextilePagePresenter } from './TextilePage.presenter';
import { OrderCard } from './OrderCard';

export const TextilePage = () => {
  const { openOrders } = useTextilePagePresenter();

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Textile</Title>
        <Text size="sm" color="dimmed" mt="xs">
          Commandes depuis le 16 janvier 2025
        </Text>
        <section className={styles.section}>
          <Stack spacing="lg">
            {openOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Stack>
        </section>
      </div>
    </div>
  );
};
