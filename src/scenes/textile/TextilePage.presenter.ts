'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { isAfter, parseISO } from 'date-fns';

export const useTextilePagePresenter = () => {
  const BILLING_START_DATE = '2025-01-16';
  const queryClient = useQueryClient();
  const [openOrders, setOpenOrders] = useState<any[]>([]);

  // Récupérer toutes les commandes
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  // Mettre à jour les commandes ouvertes quand les données changent
  useEffect(() => {
    if (!query.data) return;

    const recentOrders = query.data.data.filter((order: any) => {
      const orderDate = parseISO(order.createdAt);
      return isAfter(orderDate, parseISO(BILLING_START_DATE));
    });

    const filteredOrders = recentOrders.filter(
      (order: any) => 
        order.status === 'OPEN' && 
        order.displayFinancialStatus !== 'PENDING'
    );

    setOpenOrders(filteredOrders);
  }, [query.data]);

  // Récupérer les détails des commandes
  const orderDetails = useQuery({
    queryKey: ['textile-orders', openOrders.map(o => o.id).join(',')],
    queryFn: async () => {
      if (openOrders.length === 0) return [];
      const details = await Promise.all(
        openOrders.map(order => fetchOrderDetailAction(order.id))
      );
      return details.filter(detail => detail.type === 'success');
    },
    enabled: openOrders.length > 0,
  });

  // Précharger les données au montage du composant
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['orders'],
      queryFn: () => fetchOrdersSummaryAction(),
    });
  }, [queryClient]);

  return {
    orders: orderDetails.data ?? [],
    isLoading: query.isLoading || orderDetails.isLoading,
  };
};
