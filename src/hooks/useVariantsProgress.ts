import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useHasMounted } from './useHasMounted';

interface VariantProgress {
  checked: boolean;
  sku: string;
  color: string;
  size: string;
  originalId: string;
  orderId: string;
  updatedAt: string;
}

export const useVariantsProgress = (orderId: string, products: any[]) => {
  const [variantsProgress, setVariantsProgress] = useState<VariantProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (products.length === 0) return;

    const encodedOrderId = encodeFirestoreId(orderId);
    const variantsRef = collection(db, 'variants-ordered-v2');
    const q = query(
      variantsRef,
      where('orderId', '==', encodedOrderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const variants = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as VariantProgress[];

      setVariantsProgress(variants);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, products, hasMounted]);

  return { variantsProgress, loading };
};
