import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { generateVariantId } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface VariantKey {
  orderId: string;
  sku: string;
  color: string;
  size: string;
  index: number;
  lineItemIndex?: number;
}

export function useCheckedVariants({ orderId, sku, color, size, index, lineItemIndex }: VariantKey) {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    // Générer l'ID du variant dans le même format que les autres composants
    const encodedOrderId = encodeFirestoreId(orderId);
    const variantId = generateVariantId(encodedOrderId, sku, color, size, index, lineItemIndex);
    
    // Vérifier que l'orderId est valide
    if (!orderId) {
      setCheckedCount(0);
      return;
    }

    // Écouter le document spécifique dans variants-ordered-v2
    const variantRef = doc(db, 'variants-ordered-v2', variantId);
    
    const unsubscribe = onSnapshot(variantRef, (snapshot) => {
      if (snapshot.exists()) {
        setCheckedCount(snapshot.data()?.checked ? 1 : 0);
      } else {
        setCheckedCount(0);
      }
    });

    return () => unsubscribe();
  }, [orderId, sku, color, size, index, lineItemIndex]);

  return checkedCount;
}
