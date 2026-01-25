import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import { format } from 'date-fns';

export const useWeeklyBillingNotes = (weekStart: Date) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentShop } = useShop();

  const weekId = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    if (!currentShop) {
      setLoading(false);
      return;
    }

    const loadNote = async () => {
      const { data } = await supabase
        .from('weekly_billing_notes')
        .select('note')
        .eq('shop_id', currentShop.id)
        .eq('week', weekId)
        .single();

      setNote(data?.note || '');
      setLoading(false);
    };

    loadNote();

    const channel = supabase
      .channel(`weekly-billing-note-${weekId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weekly_billing_notes', filter: `week=eq.${weekId}` },
        () => loadNote()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekId, currentShop]);

  const saveNote = async () => {
    if (!currentShop) return;
    setSaving(true);
    try {
      await supabase
        .from('weekly_billing_notes')
        .upsert({
          shop_id: currentShop.id,
          week: weekId,
          note,
        }, { onConflict: 'shop_id,week' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
    } finally {
      setSaving(false);
    }
  };

  return { note, setNote, loading, saving, saveNote };
};
