import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    const fetchCheckboxState = async () => {
      try {
        if (!auth.currentUser) {
          setError('Utilisateur non connecté');
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, 'billingCheckboxes', encodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as BillingCheckboxState;
          setIsChecked(data.isChecked);
        } else {
          await setDoc(docRef, {
            isChecked: false,
            lastUpdated: new Date(),
            originalId: orderId,
            userId: auth.currentUser.uid
          });
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching billing checkbox state:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckboxState();
  }, [orderId, encodedId]);

  const toggleCheckbox = async () => {
    try {
      if (!auth.currentUser) {
        setError('Utilisateur non connecté');
        return;
      }

      const docRef = doc(db, 'billingCheckboxes', encodedId);
      const newState = !isChecked;
      
      await updateDoc(docRef, {
        isChecked: newState,
        lastUpdated: new Date(),
        userId: auth.currentUser.uid
      });

      setIsChecked(newState);
      setError(null);
    } catch (error) {
      console.error('Error updating billing checkbox state:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return { isChecked, isLoading, error, toggleCheckbox };
};
