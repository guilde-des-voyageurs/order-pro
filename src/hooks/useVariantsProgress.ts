import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
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
  id: string;
}

function isValidVariantProgress(data: DocumentData): data is VariantProgress {
  return (
    typeof data.checked === 'boolean' &&
    typeof data.sku === 'string' &&
    typeof data.color === 'string' &&
    typeof data.size === 'string' &&
    typeof data.originalId === 'string' &&
    typeof data.orderId === 'string' &&
    typeof data.updatedAt === 'string' &&
    typeof data.id === 'string'
  );
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
      const variants = snapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        }))
        .filter(isValidVariantProgress);

      setVariantsProgress(variants);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, products, hasMounted]);

  return { variantsProgress, loading };
};
