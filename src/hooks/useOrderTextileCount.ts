import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ShopifyOrder } from '@/types/shopify';

export function useOrderTextileCount(order: ShopifyOrder) {
  const [checkedCount, setCheckedCount] = useState(0);
  const total = order.lineItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  useEffect(() => {
    if (!order.id) return;

    // Écouter tous les variants de la commande
    const variantsRef = collection(db, 'variants');
    const q = query(variantsRef, where('orderId', '==', order.id));

    return onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;
      setCheckedCount(count);
    });
  }, [order.id]);

  return { checked: checkedCount, total };
}
