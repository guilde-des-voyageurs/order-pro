import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { encodeFirestoreId } from '@/utils/firestore-helpers';

export const useOrderProgress = (orderId: string | undefined) => {
  const [progress, setProgress] = useState({ checkedCount: 0, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setError('Utilisateur non connecté');
      setIsLoading(false);
      return;
    }

    if (!orderId) {
      setError('ID de commande manquant');
      setIsLoading(false);
      return;
    }

    const encodedOrderId = encodeFirestoreId(orderId);
    const orderRef = doc(db, 'orders-progress', encodedOrderId);
    
    const unsubscribe = onSnapshot(orderRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProgress({
            checkedCount: data.checkedCount || 0,
            totalCount: data.totalCount || 0,
          });
        } else {
          setProgress({ checkedCount: 0, totalCount: 0 });
        }
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching order progress:', error);
        setError('Erreur lors de la récupération des données');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return { progress, isLoading, error };
};
