'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface Product {
  quantity: number;
  sku: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

const generateVariantId = (
  orderId: string,
  sku: string, 
  color: string | null, 
  size: string | null,
  index: number
): string => {
  const id = `${orderId}--${sku}--${color || 'no-color'}--${size || 'no-size'}--${index}`;
  return encodeFirestoreId(id);
};

export const useVariantsProgress = (products: Product[], orderId: string) => {
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
      )?.value || null;
      const size = product.selectedOptions.find(
        opt => opt.name.toLowerCase().includes('taille')
      )?.value || null;

      return Array(product.quantity)
        .fill(null)
        .map((_, index) => generateVariantId(orderId, product.sku, color, size, index));
    });

    // Créer plusieurs listeners pour des groupes de 10 variants (limite Firestore)
    const batchSize = 10;
    const unsubscribes: (() => void)[] = [];
    
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
  }, [products, orderId]);

  return { checkedCount, totalCount };
};
