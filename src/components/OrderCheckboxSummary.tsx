'use client';

import { Text } from '@mantine/core';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';

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
    const color = getColorFromVariant(item);
    const size = getSizeFromVariant(item);
    
    const checkedCount = useCheckedVariants({
      orderId,
      sku: item.sku || '',
      color: color,
      size: size,
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
