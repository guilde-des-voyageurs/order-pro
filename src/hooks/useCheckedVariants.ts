import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import { generateVariantId } from '@/utils/variant-helpers';

interface UseCheckedVariantsProps {
  orderId: string;
  sku?: string;
  color: string;
  size: string;
  quantity: number;
  productIndex: number;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
}

export function useCheckedVariants({ orderId, sku = '', color, size, quantity, productIndex, lineItems }: UseCheckedVariantsProps) {
  const [checkedCount, setCheckedCount] = useState(0);
  const checkedVariantsRef = useRef(new Set<string>());
  const { currentShop } = useShop();

  useEffect(() => {
    if (!orderId || !currentShop) {
      setCheckedCount(0);
      return;
    }

    // Générer les IDs pour tous les variants de cette combinaison
    const variantIds = Array.from({ length: quantity }).map((_, quantityIndex) => {
      return generateVariantId(orderId, sku, color, size, productIndex, quantityIndex);
    });

    const loadCheckedStatus = async () => {
      const { data } = await supabase
        .from('line_item_checks')
        .select('id, checked')
        .in('id', variantIds);

      if (data) {
        checkedVariantsRef.current.clear();
        data.forEach(item => {
          if (item.checked) {
            checkedVariantsRef.current.add(item.id);
          }
        });
        setCheckedCount(checkedVariantsRef.current.size);
      }
    };

    loadCheckedStatus();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`line-item-checks-${orderId}-${productIndex}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'line_item_checks', filter: `order_id=eq.${orderId}` },
        () => loadCheckedStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      checkedVariantsRef.current.clear();
      setCheckedCount(0);
    };
  }, [orderId, sku, color, size, productIndex, quantity, currentShop]);

  return checkedCount;
}
