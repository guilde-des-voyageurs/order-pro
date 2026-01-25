import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export function useMonthlyBalance(month: string) {
  const [balance, setBalance] = useState(0);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!month || !currentShop) return;

    const loadBalance = async () => {
      const { data } = await supabase
        .from('monthly_balance')
        .select('balance')
        .eq('shop_id', currentShop.id)
        .eq('month', month)
        .single();

      setBalance(data?.balance || 0);
    };

    loadBalance();

    const channel = supabase
      .channel(`monthly-balance-${month}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_balance', filter: `month=eq.${month}` },
        () => loadBalance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, currentShop]);

  const updateBalance = async (amount: number) => {
    if (!month || !currentShop) return;
    await supabase
      .from('monthly_balance')
      .upsert({ shop_id: currentShop.id, month, balance: amount }, { onConflict: 'shop_id,month' });
  };

  return { balance, updateBalance };
}
