import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export const useOrderProgress = (orderId: string) => {
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) {
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from('order_progress')
        .select('*')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      if (!error && data) {
        setCheckedCount(data.checked_count || 0);
        setTotalCount(data.total_count || 0);
      }
      setLoading(false);
    };

    loadProgress();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`order-progress-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_progress', 
          filter: `order_id=eq.${orderId}` 
        },
        () => loadProgress()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  return { checkedCount, totalCount, loading };
};
