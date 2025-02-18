'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { isAfter, parseISO } from 'date-fns';

export const useHomePagePresenter = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const BILLING_START_DATE = '2025-01-16';

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  const recentOrders = (query.data?.data ?? []).filter((order) => {
    const orderDate = parseISO(order.createdAt);
    return isAfter(orderDate, parseISO(BILLING_START_DATE));
  });

  const openOrders = recentOrders.filter(
    (order) => order.status === 'OPEN',
  );

  const closedOrders = recentOrders.filter(
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

  const openOrderQuantityPerTypeStr = Object.entries(openOrderQuantityPerType)
    .map(([key, value]) => `${value} ${key}`)
    .join(', ');

  return {
    openOrders,
    closedOrders,
    selected,
    setSelected,
    openOrderQuantityPerTypeStr,
    isLoading: query.isLoading
  };
};
