import { useMemo } from 'react';
import { useCheckedVariants } from './useCheckedVariants';
import type { ShopifyOrder } from '@/types/shopify';

export function useOrderCheckedCounts(order: ShopifyOrder) {
  const checkedCounts = useMemo(() => {
    const total = order.lineItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const checked = order.lineItems?.reduce((acc, item, index) => {
      const [color, size] = (item.variantTitle || '').split(' / ');
      const checkedCount = useCheckedVariants({
        orderId: order.id,
        sku: item.sku || '',
        color: color || '',
        size: size || '',
        productIndex: index,
        quantity: item.quantity,
        lineItems: [{
          sku: item.sku || undefined,
          variantTitle: item.variantTitle || undefined,
          quantity: item.quantity
        }]
      });
      return acc + checkedCount;
    }, 0) || 0;

    return { total, checked };
  }, [order]);

  return checkedCounts;
}
