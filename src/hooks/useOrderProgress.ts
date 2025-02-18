import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { encodeFirestoreId } from '@/utils/firestore-helpers';

export const useOrderProgress = (orderId: string) => {
  const [progress, setProgress] = useState({ checkedCount: 0, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setError('Utilisateur non connecté');
      setIsLoading(false);
      return;
    }

    const encodedOrderId = encodeFirestoreId(orderId);
    const orderRef = doc(db, 'orders-progress', encodedOrderId);
    
    const unsubscribe = onSnapshot(orderRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProgress({
            checkedCount: data.checkedCount || 0,
            totalCount: data.totalCount || 0
          });
        }
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to order progress:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return { progress, isLoading, error };
};
