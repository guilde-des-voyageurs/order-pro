import { Text } from '@mantine/core';
import type { OrderCost } from '@/types/order-cost';
import { useOrderCost } from '@/hooks/useOrderCost';

interface OrderTotalCellProps {
  orderId: string;
}

export function OrderTotalCell({ orderId }: OrderTotalCellProps) {
  const orderCost = useOrderCost(orderId);

  if (!orderCost) {
    return <Text size="sm" c="dimmed">-</Text>;
  }

  if (!orderCost?.total) return null;

  return (
    <Text size="sm" fw={500}>
      {orderCost.total.toFixed(2)}€ HT
    </Text>
  );
}
