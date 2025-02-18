'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Product {
  quantity: number;
  sku: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

const encodeVariantId = (
  sku: string, 
  color: string | null, 
  size: string | null, 
  index: number
): string => {
  const id = `${sku}-${color || 'no-color'}-${size || 'no-size'}-${index}`;
  return Buffer.from(id).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

export const useVariantsProgress = (products: Product[]) => {
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser || products.length === 0) return;

    // Calculer le nombre total de variantes
    const total = products.reduce((acc, product) => acc + product.quantity, 0);
    setTotalCount(total);

    // Créer un tableau de tous les IDs de variants possibles
    const variantIds = products.flatMap(product => {
      const color = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('couleur')
      )?.value;
      const size = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('taille')
      )?.value;

      return Array(product.quantity)
        .fill(null)
        .map((_, index) => encodeVariantId(product.sku, color, size, index));
    });

    // Créer plusieurs listeners pour des groupes de 10 variants (limite Firestore)
    const batchSize = 10;
    const unsubscribes = [];
    
    for (let i = 0; i < variantIds.length; i += batchSize) {
      const batchIds = variantIds.slice(i, i + batchSize);
      const q = query(
        collection(db, 'variants-ordered'),
        where('userId', '==', auth.currentUser.uid),
        where('__name__', 'in', batchIds)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const checkedInBatch = snapshot.docs.filter(doc => doc.data().checked).length;
        setCheckedCount(prev => {
          // Stocker le compte de ce batch
          const batchIndex = Math.floor(i / batchSize);
          const counts = new Map<number, number>();
          counts.set(batchIndex, checkedInBatch);
          
          // Calculer le total
          let total = 0;
          for (const count of counts.values()) {
            total += count;
          }
          return total;
        });
      });

      unsubscribes.push(unsubscribe);
    }

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [products]);

  return { checkedCount, totalCount };
};
