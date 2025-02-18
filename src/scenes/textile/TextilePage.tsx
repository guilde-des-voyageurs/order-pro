'use client';

import styles from './TextilePage.module.scss';
import { Box, Card, Stack, Text, Title, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { isAfter, parseISO } from 'date-fns';
import { OrderCheckbox } from '@/components/OrderCheckbox';

const OrderCard = ({ order }: { order: any }) => {
  const query = useQuery({
    queryKey: ['orders', order.id],
    queryFn: () => fetchOrderDetailAction(order.id),
  });

  if (!query.data || query.data.type === 'error') {
    return null;
  }

  const orderDetail = query.data.data;

  return (
    <Card 
      key={orderDetail.id} 
      shadow="sm" 
      p="lg"
      radius="md"
      withBorder
    >
      <Group position="apart" mb="md">
        <Title order={3}>
          Commande {orderDetail.name}
        </Title>
        <Group spacing="xs">
          <Text size="sm" color="dimmed">Textile commandé</Text>
          <OrderCheckbox orderId={orderDetail.id} className={styles.checkbox_label} />
        </Group>
      </Group>
      <Stack spacing="xs">
        {orderDetail.products.map((product: any, index: number) => (
          <Box key={index}>
            <Text>
              {product.quantity}x {product.sku} - {
                product.selectedOptions
                  .filter((opt: any) => 
                    opt.name.toLowerCase().includes('taille') || 
                    opt.name.toLowerCase().includes('couleur')
                  )
                  .map((opt: any) => opt.value)
                  .join(' - ')
              }
            </Text>
          </Box>
        ))}
      </Stack>
    </Card>
  );
};

export const TextilePage = () => {
  const BILLING_START_DATE = '2025-01-16';

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  if (query.isLoading) {
    return (
      <div className={styles.view}>
        <div className={styles.main_content}>
          <Title order={2}>Textile</Title>
          <Text>Chargement des commandes...</Text>
        </div>
      </div>
    );
  }

  const recentOrders = (query.data?.data ?? []).filter((order) => {
    const orderDate = parseISO(order.createdAt);
    return isAfter(orderDate, parseISO(BILLING_START_DATE));
  });

  const openOrders = recentOrders.filter(
    (order) => 
      order.status === 'OPEN' && 
      order.displayFinancialStatus !== 'PENDING'
  );

  if (openOrders.length === 0) {
    return (
      <div className={styles.view}>
        <div className={styles.main_content}>
          <Title order={2}>Textile</Title>
          <Text>Aucune commande à afficher</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Textile</Title>
        <Stack spacing="lg">
          {openOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Stack>
      </div>
    </div>
  );
};
