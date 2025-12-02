'use client';

import { Text } from '@mantine/core';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';

interface OrderCheckboxSummaryProps {
  orderId: string;
  lineItems: Array<{
    sku: string;
    variantTitle?: string;
    quantity: number;
  }>;
}

export function OrderCheckboxSummary({ orderId, lineItems }: OrderCheckboxSummaryProps) {
  let totalChecked = 0;
  let totalQuantity = 0;

  lineItems.forEach((item, index) => {
    const [color, size] = (item.variantTitle || '').split(' / ');
    
    const checkedCount = useCheckedVariants({
      orderId,
      sku: item.sku || '',
      color: color || '',
      size: size || '',
      productIndex: index,
      quantity: item.quantity,
      lineItems
    });

    totalChecked += checkedCount;
    totalQuantity += item.quantity;
  });

  return (
    <Text size="sm" fw={500}>
      {totalChecked}/{totalQuantity}
    </Text>
  );
}
