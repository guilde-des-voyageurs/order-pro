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

interface Product {
  quantity: number;
  sku: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface OrderDetailSuccess {
  type: 'success';
  data: {
    id: string;
    name: string;
    products: Product[];
  };
}

interface OrderDetailError {
  type: 'error';
  error: string;
}

type OrderDetailResponse = OrderDetailSuccess | OrderDetailError;

export const OrderCard = ({ order }: OrderCardProps) => {
  const { data: orderDetail } = useQuery<OrderDetailResponse, Error>({
    queryKey: ['order-detail', order.id],
    queryFn: async (): Promise<OrderDetailResponse> => {
      const response = await fetchOrderDetailAction(order.id);
      return response as OrderDetailResponse;
    },
  });

  return (
    <div className={styles.order_row}>
      <Group justify="space-between">
        <Title order={3}>Commande {order.name}</Title>
        <Group gap="xs">
          <Text size="sm" color="dimmed">Textile commandé</Text>
          <OrderCheckbox orderId={order.id} className={styles.checkbox_label} />
        </Group>
      </Group>
      {orderDetail?.type === 'success' && (
        <Stack gap="xs" mt="md">
          {orderDetail.data.products.map((product: Product, index: number) => {
            const color = product.selectedOptions.find(
              (opt) => opt.name.toLowerCase().includes('couleur')
            )?.value;
            const size = product.selectedOptions.find(
              (opt) => opt.name.toLowerCase().includes('taille')
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
