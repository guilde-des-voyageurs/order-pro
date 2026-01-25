import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

export interface PriceRule {
  id?: string;
  searchString: string;
  price: number;
}

export function usePriceRules() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop) {
      setRules([]);
      setIsLoading(false);
      return;
    }

    const loadRules = async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('shop_id', currentShop.id)
        .eq('is_active', true)
        .order('rule_name', { ascending: true });

      if (!error && data) {
        // Convertir le nouveau format vers l'ancien format pour compatibilité
        setRules(data.map(rule => ({
          id: rule.id,
          searchString: rule.condition_value || rule.rule_name,
          price: rule.price_value,
        })));
      }
      setIsLoading(false);
    };

    loadRules();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('pricing-rules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_rules', filter: `shop_id=eq.${currentShop.id}` },
        () => loadRules()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentShop]);

  return { rules, isLoading };
}

export function calculateItemPrice(itemString: string, rules: PriceRule[]): number {
  let totalPrice = 0;

  // Pour chaque règle
  rules.forEach(rule => {
    // Vérifier que la chaîne de recherche existe
    if (rule.searchString && itemString) {
      // Si la chaîne de recherche est présente dans l'item
      if (itemString.toLowerCase().includes(rule.searchString.toLowerCase())) {
        totalPrice += rule.price;
      }
    }
  });

  return Number(totalPrice);
}
