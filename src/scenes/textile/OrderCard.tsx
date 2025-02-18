'use client';

import { Group, Stack, Text, Title, Card } from '@mantine/core';
import { OrderCheckbox } from '@/components/OrderCheckbox';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import styles from './TextilePage.module.scss';

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

interface OrderCardProps {
  order: {
    id: string;
    name: string;
  };
  orderDetail?: OrderDetailSuccess;
}

export const OrderCard = ({ order, orderDetail }: OrderCardProps) => {
  const getOptionValue = (product: Product, optionName: string) => {
    return product.selectedOptions.find(
      opt => opt.name.toLowerCase().includes(optionName.toLowerCase())
    )?.value;
  };

  return (
    <Card withBorder className={styles.order_row}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Title order={3}>Commande {order.name}</Title>
          <Group gap="xs">
            <Text size="sm" color="dimmed">Textile commandé</Text>
            <OrderCheckbox orderId={order.id} className={styles.checkbox_label} />
          </Group>
        </Group>

        {orderDetail?.type === 'success' && (
          <Stack gap="xs" mt="md">
            {orderDetail.data.products.map((product, index) => {
              const color = getOptionValue(product, 'couleur');
              const size = getOptionValue(product, 'taille');
              
              return (
                <Group key={index} position="apart">
                  <Group gap="sm">
                    <VariantCheckbox
                      sku={product.sku}
                      color={color}
                      size={size}
                    />
                    <Text size="sm">
                      {product.quantity}x {product.sku}
                      {color ? ` - ${color}` : ''}
                      {size ? ` - ${size}` : ''}
                    </Text>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};
