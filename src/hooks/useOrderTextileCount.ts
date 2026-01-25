import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import type { ShopifyOrder } from '@/types/shopify';

export function useOrderTextileCount(order: ShopifyOrder) {
  const [checkedCount, setCheckedCount] = useState(0);
  const { currentShop } = useShop();
  const total = order.lineItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  useEffect(() => {
    if (!order.id || !currentShop) return;

    const loadCount = async () => {
      const { count } = await supabase
        .from('line_item_checks')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', currentShop.id)
        .eq('order_id', order.id)
        .eq('checked', true);

      setCheckedCount(count || 0);
    };

    loadCount();

    const channel = supabase
      .channel(`order-textile-count-${order.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'line_item_checks', filter: `order_id=eq.${order.id}` },
        () => loadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, currentShop]);

  return { checked: checkedCount, total };
}
