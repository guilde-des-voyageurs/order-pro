'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { isAfter, parseISO } from 'date-fns';

export const useBillingPagePresenter = () => {
  const BILLING_START_DATE = '2025-01-16';

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  const recentOrders = (query.data?.data ?? []).filter((order) => {
    const orderDate = parseISO(order.createdAt);
    return isAfter(orderDate, parseISO(BILLING_START_DATE));
  });

  return {
    isLoading: query.isLoading,
    error: query.error,
    orders: recentOrders,
  };
};
