import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export const useOrderProgress = (orderId: string) => {
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encodedOrderId = encodeFirestoreId(orderId);
    const progressRef = doc(db, 'textile-progress-v2', encodedOrderId);

    const unsubscribe = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCheckedCount(data.checkedCount || 0);
        setTotalCount(data.totalCount || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  return { checkedCount, totalCount, loading };
};
