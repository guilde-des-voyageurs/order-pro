import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export const useWeeklyBillingCheckboxes = (orderIds: string[]) => {
  const [checkedStates, setCheckedStates] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!orderIds.length || !currentShop) {
      setCheckedStates(new Map());
      setLoading(false);
      return;
    }

    const loadStatuses = async () => {
      const { data } = await supabase
        .from('order_invoices')
        .select('order_id, invoiced')
        .eq('shop_id', currentShop.id)
        .in('order_id', orderIds);

      const newStates = new Map<string, boolean>();
      data?.forEach(item => {
        newStates.set(item.order_id, item.invoiced || false);
      });
      setCheckedStates(newStates);
      setLoading(false);
    };

    loadStatuses();

    const channel = supabase
      .channel('weekly-invoice-statuses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_invoices' },
        () => loadStatuses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setCheckedStates(new Map());
    };
  }, [orderIds, currentShop]);

  const checkedCount = Array.from(checkedStates.values()).filter(Boolean).length;
  const checked = orderIds.length > 0 && checkedCount === orderIds.length;
  const indeterminate = checkedCount > 0 && checkedCount < orderIds.length;

  const handleChange = async () => {
    if (!orderIds.length || !currentShop) return;
    
    const shouldCheck = checkedCount < orderIds.length;
    
    setLoading(true);
    try {
      const upsertData = orderIds.map(orderId => ({
        shop_id: currentShop.id,
        order_id: orderId,
        invoiced: shouldCheck,
      }));

      await supabase
        .from('order_invoices')
        .upsert(upsertData, { onConflict: 'shop_id,order_id' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
    } finally {
      setLoading(false);
    }
  };

  return { checked, indeterminate, loading, handleChange };
};
