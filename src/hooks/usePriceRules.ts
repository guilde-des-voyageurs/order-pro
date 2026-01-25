import { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';

export interface PriceRule {
  id?: string;
  searchString: string;
  price: number;
}

export function usePriceRules() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentShop } = useShop();

  useEffect(() => {
    // Table pricing_rules supprimée - retourner un tableau vide
    setRules([]);
    setIsLoading(false);
  }, [currentShop]);

  return { rules, isLoading };
}

export function calculateItemPrice(itemString: string, rules: PriceRule[]): number {
  // Fonction dépréciée - retourne 0
  return 0;
}
