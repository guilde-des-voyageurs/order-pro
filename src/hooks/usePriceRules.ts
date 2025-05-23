import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';

export interface PriceRule {
  id?: string;
  searchString: string;
  price: number;
}

export function usePriceRules() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rulesRef = collection(db, 'price-rules');
    const unsubscribe = onSnapshot(rulesRef, (snapshot) => {
      const loadedRules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceRule[];
      setRules(loadedRules);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
