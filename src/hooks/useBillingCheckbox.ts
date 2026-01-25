import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export const useBillingCheckbox = (orderId: string) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) {
      setLoading(false);
      return;
    }

    const loadStatus = async () => {
      const { data } = await supabase
        .from('order_invoices')
        .select('invoiced')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      setChecked(data?.invoiced || false);
      setLoading(false);
    };

    loadStatus();

    const channel = supabase
      .channel(`invoice-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_invoices', filter: `order_id=eq.${orderId}` },
        () => loadStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  const handleChange = async (newChecked: boolean) => {
    if (!currentShop) return;
    setLoading(true);
    try {
      await supabase
        .from('order_invoices')
        .upsert({
          shop_id: currentShop.id,
          order_id: orderId,
          invoiced: newChecked,
        }, { onConflict: 'shop_id,order_id' });
      setChecked(newChecked);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setChecked(!newChecked);
    } finally {
      setLoading(false);
    }
  };

  return { checked, loading, handleChange };
};
