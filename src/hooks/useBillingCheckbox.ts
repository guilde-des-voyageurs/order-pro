import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { auth } from '@/firebase/config';

interface BillingCheckboxState {
  isChecked: boolean;
  lastUpdated: Date;
  originalId: string;
  userId: string;
}

const encodeOrderId = (orderId: string) => {
  return Buffer.from(orderId).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

export const useBillingCheckbox = (orderId: string) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const encodedId = encodeOrderId(orderId);

  useEffect(() => {
    if (!auth.currentUser) {
      setError('Utilisateur non connecté');
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'billingCheckboxes', encodedId);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as BillingCheckboxState;
          setIsChecked(data.isChecked);
        } else {
          setDoc(docRef, {
            isChecked: false,
            lastUpdated: new Date(),
            originalId: orderId,
            userId: auth.currentUser!.uid
          });
        }
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, encodedId]);

  const toggleCheckbox = async () => {
    try {
      if (!auth.currentUser) {
        setError('Utilisateur non connecté');
        return;
      }

      const docRef = doc(db, 'billingCheckboxes', encodedId);
      await setDoc(docRef, {
        isChecked: !isChecked,
        lastUpdated: new Date(),
        originalId: orderId,
        userId: auth.currentUser.uid
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return { isChecked, isLoading, error, toggleCheckbox };
};
