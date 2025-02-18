'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { isAfter, parseISO } from 'date-fns';

export const useTextilePagePresenter = () => {
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
    (order) => 
      order.status === 'OPEN' && 
      order.displayFinancialStatus !== 'PENDING'
  );

  return {
    openOrders,
  };
};
