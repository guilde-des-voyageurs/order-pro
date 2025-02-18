'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { isAfter, parseISO } from 'date-fns';
import { useState } from 'react';

interface OrderDetail {
  type: 'success';
  data: {
    id: string;
    name: string;
    products: Array<{
      quantity: number;
      sku: string;
      selectedOptions: Array<{
        name: string;
        value: string;
      }>;
    }>;
  };
}

// Fonction pour charger les détails par lots
async function fetchOrderDetailsInBatches(
  orderIds: string[], 
  onProgress: (loaded: number, total: number) => void,
  batchSize: number = 5
) {
  const results: Record<string, OrderDetail> = {};
  let loadedCount = 0;
  
  for (let i = 0; i < orderIds.length; i += batchSize) {
    const batch = orderIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(id => fetchOrderDetailAction(id))
    );
    
    batchResults.forEach((detail, index) => {
      if (detail.type === 'success') {
        results[batch[index]] = detail;
        loadedCount++;
        onProgress(loadedCount, orderIds.length);
      }
    });
  }
  
  return results;
}

export const useTextilePagePresenter = () => {
  const BILLING_START_DATE = '2025-01-16';
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  const recentOrders = (ordersQuery.data?.data ?? []).filter((order) => {
    const orderDate = parseISO(order.createdAt);
    return isAfter(orderDate, parseISO(BILLING_START_DATE));
  });

  const openOrders = recentOrders.filter(
    (order) => 
      order.status === 'OPEN' && 
      order.displayFinancialStatus !== 'PENDING'
  );

  const orderDetailsQuery = useQuery({
    queryKey: ['textile-orders-details', openOrders.map(o => o.id).join(',')],
    queryFn: () => fetchOrderDetailsInBatches(
      openOrders.map(o => o.id),
      (loaded, total) => setLoadingProgress({ loaded, total })
    ),
    enabled: openOrders.length > 0,
  });

  return {
    openOrders,
    orderDetails: orderDetailsQuery.data ?? {},
    isLoading: ordersQuery.isLoading || orderDetailsQuery.isLoading,
    loadingProgress,
  };
};
