import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export function useBillingNotes(orderId: string) {
  const [note, setNote] = useState('');
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) return;

    const loadNote = async () => {
      const { data } = await supabase
        .from('billing_notes')
        .select('note')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      setNote(data?.note || '');
    };

    loadNote();

    const channel = supabase
      .channel(`billing-note-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'billing_notes', filter: `order_id=eq.${orderId}` },
        () => loadNote()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  const updateNote = useCallback(async (newNote: string) => {
    if (!currentShop) return;
    await supabase
      .from('billing_notes')
      .upsert({
        shop_id: currentShop.id,
        order_id: orderId,
        note: newNote,
      }, { onConflict: 'shop_id,order_id' });
    setNote(newNote);
  }, [orderId, currentShop]);

  return { note, updateNote };
}
