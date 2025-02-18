'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { OrderCheckbox } from '@/components/OrderCheckbox';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import styles from './TextilePage.module.scss';

interface OrderCardProps {
  order: {
    id: string;
    name: string;
  };
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const { data } = useQuery({
    queryKey: ['order-detail', order.id],
    queryFn: () => fetchOrderDetailAction(order.id),
  });

  return (
    <div className={styles.order_row}>
      <Group position="apart">
        <Title order={3}>Commande {order.name}</Title>
        <Group spacing="xs">
          <Text size="sm" color="dimmed">Textile commandé</Text>
          <OrderCheckbox orderId={order.id} className={styles.checkbox_label} />
        </Group>
      </Group>
      {data && data.type === 'success' && (
        <Stack spacing="xs" mt="md">
          {data.data.products.map((product: any, index: number) => {
            const color = product.selectedOptions.find(
              (opt: any) => opt.name.toLowerCase().includes('couleur')
            )?.value;
            const size = product.selectedOptions.find(
              (opt: any) => opt.name.toLowerCase().includes('taille')
            )?.value;

            return (
              <Text key={index} size="sm">
                {product.quantity}x {product.sku}{color ? ` - ${color}` : ''}{size ? ` - ${size}` : ''}
              </Text>
            );
          })}
        </Stack>
      )}
    </div>
  );
};
