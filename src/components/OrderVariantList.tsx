import { useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';

interface OrderVariantListProps {
  orderId: string;
  variants: Array<{
    sku: string;
    color: string;
    size: string;
    quantity: number;
  }>;
}

export function OrderVariantList({ orderId, variants }: OrderVariantListProps) {
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;

    const updateProgress = async () => {
      const encodedOrderId = encodeFirestoreId(orderId);
      const totalCount = variants.reduce((acc, variant) => acc + variant.quantity, 0);

      const progressRef = doc(db, 'textile-progress-v2', encodedOrderId);
      await setDoc(progressRef, {
        totalCount,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    };

    updateProgress();
  }, [orderId, variants, hasMounted]);

  return null;
}
