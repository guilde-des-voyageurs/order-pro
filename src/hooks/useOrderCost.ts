import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import type { OrderCost } from '@/types/order-cost';

export function useOrderCost(orderId: string) {
  const [orderCost, setOrderCost] = useState<OrderCost | null>(null);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) return;

    const loadCost = async () => {
      const { data, error } = await supabase
        .from('order_costs')
        .select('*')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      if (!error && data) {
        setOrderCost({
          costs: data.costs as OrderCost['costs'],
          handlingFee: data.handling_fee,
          balance: data.balance,
        });
      } else {
        setOrderCost(null);
      }
    };

    loadCost();

    const channel = supabase
      .channel(`order-cost-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_costs', filter: `order_id=eq.${orderId}` },
        () => loadCost()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  return orderCost;
}
