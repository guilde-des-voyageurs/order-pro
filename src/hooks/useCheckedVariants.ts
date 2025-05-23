import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';

export function useCheckedVariants(orderId: string, variantIds: string[]) {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    const variantsRef = collection(db, 'orders-v2', orderId, 'variants');
    
    const unsubscribe = onSnapshot(variantsRef, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        if (variantIds.includes(doc.id) && doc.data().checked) {
          count++;
        }
      });
      setCheckedCount(count);
    });

    return () => unsubscribe();
  }, [orderId, variantIds]);

  return checkedCount;
}
