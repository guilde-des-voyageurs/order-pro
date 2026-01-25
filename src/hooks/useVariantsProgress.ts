import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import { useHasMounted } from './useHasMounted';

interface VariantProgress {
  checked: boolean;
  sku: string;
  color: string;
  size: string;
  orderId: string;
  id: string;
}

export const useVariantsProgress = (orderId: string, products: any[]) => {
  const [variantsProgress, setVariantsProgress] = useState<VariantProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const hasMounted = useHasMounted();
  const { currentShop } = useShop();

  useEffect(() => {
    if (products.length === 0 || !currentShop) return;

    const loadVariants = async () => {
      const { data } = await supabase
        .from('line_item_checks')
        .select('*')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId);

      if (data) {
        setVariantsProgress(data.map(item => ({
          id: item.id,
          checked: item.checked,
          sku: item.sku,
          color: item.color,
          size: item.size,
          orderId: item.order_id,
        })));
      }
      setLoading(false);
    };

    loadVariants();

    const channel = supabase
      .channel(`variants-progress-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'line_item_checks', filter: `order_id=eq.${orderId}` },
        () => loadVariants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, products, hasMounted, currentShop]);

  return { variantsProgress, loading };
};
