'use client';

import styles from './TextilePage.module.scss';
import { Group, Stack, Text, Title } from '@mantine/core';
import { useTextilePagePresenter } from './TextilePage.presenter';
import { OrderCheckbox } from '@/components/OrderCheckbox';

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
              <div key={order.id} className={styles.order_row}>
                <Group position="apart">
                  <Title order={3}>Commande {order.name}</Title>
                  <Group spacing="xs">
                    <Text size="sm" color="dimmed">Textile commandé</Text>
                    <OrderCheckbox orderId={order.id} className={styles.checkbox_label} />
                  </Group>
                </Group>
              </div>
            ))}
          </Stack>
        </section>
      </div>
    </div>
  );
};
