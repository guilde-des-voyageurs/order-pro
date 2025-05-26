import { Text } from '@mantine/core';
import { useOrderCost } from '@/hooks/useOrderCost';

interface OrderTotalCellProps {
  orderId: string;
}

export function OrderTotalCell({ orderId }: OrderTotalCellProps) {
  const orderCost = useOrderCost(orderId);

  if (!orderCost) {
    return <Text size="sm" c="dimmed">-</Text>;
  }

  return (
    <Text size="sm" fw={500}>
      {orderCost.totalCost.toFixed(2)}€ HT
    </Text>
  );
}
