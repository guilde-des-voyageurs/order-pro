import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { auth } from '@/firebase/config';

interface OrderCheckboxState {
  isChecked: boolean;
  lastUpdated: Date;
  originalId: string;
  userId: string;
}

const encodeOrderId = (orderId: string) => {
  return Buffer.from(orderId).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

const decodeOrderId = (encodedId: string) => {
  return Buffer.from(encodedId.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
};

export const useOrderCheckbox = (orderId: string) => {
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

    const docRef = doc(db, 'orderCheckboxes', encodedId);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as OrderCheckboxState;
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
        console.error('Error listening to order checkbox state:', error);
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

      const docRef = doc(db, 'orderCheckboxes', encodedId);
      await setDoc(docRef, {
        isChecked: !isChecked,
        lastUpdated: new Date(),
        originalId: orderId,
        userId: auth.currentUser.uid
      });
    } catch (error) {
      console.error('Error toggling order checkbox:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return { isChecked, isLoading, error, toggleCheckbox };
};
