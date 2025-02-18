'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSummaryAction } from '@/actions/fetch-orders-summary-action';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { isAfter, parseISO } from 'date-fns';

export const useTextilePagePresenter = () => {
  const BILLING_START_DATE = '2025-01-16';

  // Récupérer toutes les commandes
  const summaryQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersSummaryAction(),
  });

  console.log('Summary data:', summaryQuery.data);

  const recentOrders = (summaryQuery.data?.data ?? []).filter((order) => {
    const orderDate = parseISO(order.createdAt);
    return isAfter(orderDate, parseISO(BILLING_START_DATE));
  });

  console.log('Recent orders:', recentOrders);

  // Filtrer les commandes en cours qui ne sont pas en attente de paiement
  const openOrders = recentOrders.filter(
    (order) => 
      order.status === 'OPEN' && 
      order.displayFinancialStatus !== 'PENDING'
  );

  console.log('Open orders:', openOrders);

  // Récupérer les détails de chaque commande
  const openOrdersDetails = useQuery({
    queryKey: ['openOrdersDetails', openOrders.map(o => o.id)],
    queryFn: async () => {
      if (openOrders.length === 0) return [];
      const details = await Promise.all(
        openOrders.map(order => fetchOrderDetailAction(order.id))
      );
      return details.filter(detail => detail.type === 'success');
    },
    enabled: !summaryQuery.isLoading && openOrders.length > 0,
  });

  console.log('Orders details:', openOrdersDetails.data);

  return {
    orders: openOrdersDetails.data ?? [],
    isLoading: summaryQuery.isLoading || openOrdersDetails.isLoading,
  };
};
