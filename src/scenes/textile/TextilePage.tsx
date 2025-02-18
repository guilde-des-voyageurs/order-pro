'use client';

import styles from './TextilePage.module.scss';
import { Loader, Stack, Text, Title } from '@mantine/core';
import { useTextilePagePresenter } from './TextilePage.presenter';
import { OrderCard } from './OrderCard';
import { ProductsSummary } from './ProductsSummary';

export const TextilePage = () => {
  const { openOrders, orderDetails, isLoading, loadingProgress } = useTextilePagePresenter();

  if (isLoading) {
    return (
      <div className={styles.view}>
        <div className={styles.main_content}>
          <Title order={2}>Textile</Title>
          <Stack align="center" mt="xl">
            <Loader size="md" />
            <Text size="sm" color="dimmed">
              Chargement des commandes... {loadingProgress.loaded}/{loadingProgress.total}
            </Text>
          </Stack>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Textile</Title>
        <ProductsSummary orderDetails={orderDetails} />
        <section className={styles.section}>
          <Stack gap="lg">
            {openOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                orderDetail={orderDetails[order.id]}
              />
            ))}
          </Stack>
        </section>
      </div>
    </div>
  );
};
