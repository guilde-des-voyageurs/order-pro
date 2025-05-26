import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { OrderCost } from '@/types/order-cost';
import { db } from '@/firebase/db';

export function useOrderCost(orderId: string) {
  const [orderCost, setOrderCost] = useState<OrderCost | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'orders-cost', orderId),
      (doc) => {
        if (doc.exists()) {
          setOrderCost(doc.data() as OrderCost);
        } else {
          setOrderCost(null);
        }
      },
      (error) => {
        console.error('Error fetching order cost:', error);
        setOrderCost(null);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return orderCost;
}
