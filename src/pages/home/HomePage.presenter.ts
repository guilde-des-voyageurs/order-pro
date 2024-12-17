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

  return {
    selected,
    setSelected,
    query,
    openOrders,
    closedOrders,
  };
};
