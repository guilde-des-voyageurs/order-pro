import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';

export const useHomePagePresenter = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  const openOrders = (query.data?.data ?? []).filter(
    (order) => order.status === 'OPEN',
  );

  const closedOrders = (query.data?.data ?? []).filter(
    (order) => order.status !== 'OPEN',
  );

  const openOrderQuantityPerType = openOrders.reduce(
    (prev, curr) => {
      Object.entries(curr.quantityPerType).forEach(([key, value]) => {
        if (!prev[key]) {
          prev[key] = 0;
        }

        prev[key] += value;
      });

      return prev;
    },
    {} as Record<string, number>,
  );

  const openOrderQuantityPerTypeStr = Object.keys(openOrderQuantityPerType)
    .reduce(
      (prev, key) =>
        prev +
        `${key.length > 0 ? key : 'Unknown'}: ${openOrderQuantityPerType[key]}, `,
      '',
    )
    .slice(0, -2);

  return {
    selected,
    setSelected,
    query,
    openOrders,
    closedOrders,
    openOrderQuantityPerType,
    openOrderQuantityPerTypeStr,
  };
};
